from django.urls import reverse
from rest_framework.test import APITestCase

from forms.models import INVESTIGATION_ROLES, FormInstance
from forms.tests.factories import UserFactory, InvestigationFactory, FormFactory, FormInstanceFactory


def make_url(form):
    params = {
        "form_id": form.id
    }

    return reverse("form_forminstances", kwargs=params)


class FormInstanceAPITest(APITestCase):
    def setUp(self):
        self.investigation_owner = UserFactory.create()
        self.investigation = InvestigationFactory.create()
        self.form = FormFactory.create(investigation=self.investigation)
        self.investigation.add_user(self.investigation_owner, INVESTIGATION_ROLES.OWNER)

    def test_create_needs_authorization(self):
        response = self.client.post(make_url(self.form),
                                    {"form_json": {}},
                                    format="json")
        # should really be a 401...
        self.assertEqual(response.status_code, 403)

    def test_owner_can_create(self):
        self.client.force_login(self.investigation_owner)

        self.assertEqual(FormInstance.objects.count(), 0)

        response = self.client.post(make_url(self.form),
                                    {"form_json": {}},
                                    format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(FormInstance.objects.count(), 1)

    def test_owner_of_other_investigation_cannot_create(self):
        self.client.force_login(self.investigation_owner)
        other_form = FormFactory.create()

        response = self.client.post(make_url(other_form),
                                    {"form_json": {}},
                                    format="json")
        self.assertEqual(response.status_code, 403)

    def test_post_increments_version(self):
        self.client.force_login(self.investigation_owner)
        FormInstanceFactory.create(form=self.form, version=1)

        response = self.client.post(make_url(self.form),
                                    {"form_json": {}},
                                    format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data.get('version'), 2)
