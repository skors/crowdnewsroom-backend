from django.test import TestCase, Client
from django.urls import reverse

from forms.models import User, FormResponse
from forms.tests.factories import FormResponseFactory, FormInstanceFactory, TagFactory


def url_for_response(form_response):
    form = form_response.form_instance.form
    return reverse("response_json_edit", kwargs=dict(investigation_slug=form.investigation.slug,
                                                     form_slug=form.slug,
                                                     response_id=form_response.id))


class FormReponseListViewTest(TestCase):
    def setUp(self):
        User.objects.create_superuser('admin@crowdnewsroom.org', 'password')
        self.client = Client()
        self.client.login(email='admin@crowdnewsroom.org', password='password')

    def test_edit(self):
        form_response = FormResponseFactory.create(json={"name": "Gödel"})

        response = self.client.post(url_for_response(form_response), data={"json__name": "Escher"})
        self.assertEqual(response.status_code, 302)

        updated_response = FormResponse.objects.get(id=form_response.id)
        self.assertEqual(updated_response.json["name"], "Escher")

    def test_edit_non_existing_field(self):
        form_response = FormResponseFactory.create(json={"name": "Gödel"})

        response = self.client.post(url_for_response(form_response), data={"json__color": "Red"})
        self.assertEqual(response.status_code, 400)

        updated_response = FormResponse.objects.get(id=form_response.id)
        self.assertDictEqual(updated_response.json, {"name": "Gödel"})

