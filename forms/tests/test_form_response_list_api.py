from django.urls import reverse
from rest_framework.test import APITestCase

from forms.models import Investigation, UserGroup
from forms.tests.factories import UserFactory, InvestigationFactory, FormInstanceFactory, FormResponseFactory


def make_url(form_instance):
    params = {
        "form_slug": form_instance.form.slug
    }

    return reverse("responses", kwargs=params)


class FormResponseListAPITest(APITestCase):
    def setUp(self):
        self.investigation_owner = UserFactory.create()
        self.investigation = InvestigationFactory.create()
        self.form_instance = FormInstanceFactory.create()
        self.form_instance.form.investigation.add_user(self.investigation_owner, "O")

        for i in range(5):
            FormResponseFactory.create(form_instance=self.form_instance, status="S")
        for i in range(5):
            FormResponseFactory.create(form_instance=self.form_instance, status="V")

    def test_get_needs_authorization(self):
        response = self.client.get(make_url(self.form_instance))
        # should really be a 401...
        self.assertEqual(response.status_code, 403)

    def test_owner_can_get(self):
        self.client.force_login(self.investigation_owner)

        response = self.client.get(make_url(self.form_instance))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 10)

    def test_owner_cannot_get_other_investigation(self):
        form_instance = FormInstanceFactory.create()

        self.client.force_login(self.investigation_owner)

        response = self.client.get(make_url(form_instance))
        self.assertEqual(response.status_code, 403)

    def test_status_filter(self):
        self.client.force_login(self.investigation_owner)

        url = "{}?status=S".format(make_url(self.form_instance))
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 5)

    def test_files_are_converted_to_urls(self):
        form_instance = FormInstanceFactory.create(form_json=[{
            "schema": {
                "slug": "first",
                "properties": {
                    "name": {"type": "string"},
                    "picture": {"type": "string",
                                "format": "data-url"},
                }
            }
        }])

        FormResponseFactory.create(form_instance=form_instance,
                                   json={
                                       "name": "Katharina",
                                       "picture": "data-url...."
                                   })
        form_instance.form.investigation.add_user(self.investigation_owner, "O")

        self.client.force_login(self.investigation_owner)

        response = self.client.get(make_url(form_instance))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["json"]["name"], "Katharina")

        # check that data-url has been converted to a real url for file download
        self.assertTrue(response.data[0]["json"]["picture"].endswith("/files/picture"))
