from django.test import TestCase, Client
from django.urls import reverse

from forms.models import User, FormResponse
from forms.tests.factories import FormResponseFactory, FormInstanceFactory, TagFactory, UserFactory, \
    InvestigationFactory, FormFactory


def url_for_response(form_response):
    form = form_response.form_instance.form
    return reverse("response_json_edit", kwargs=dict(investigation_slug=form.investigation.slug,
                                                     form_slug=form.slug,
                                                     response_id=form_response.id))


class FormReponseListViewTest(TestCase):
    def setUp(self):
        owner = UserFactory.create()
        self.investigation = InvestigationFactory.create()
        self.investigation.add_user(owner, "O")

        self.form = FormFactory(investigation=self.investigation)
        self.client.force_login(owner)

    def make_singe_step_instance(self, properties):
        return FormInstanceFactory.create(form_json=[
            {
                "schema":
                    {
                        "title": "first",
                        "slug": "first",
                        "properties": properties
                    }
            }
        ], form=self.form)

    def test_edit_fails_for_viewer(self):
        form_instance = self.make_singe_step_instance({"name": {"type": "string"}})
        form_response = FormResponseFactory.create(json={"name": "Gödel"}, form_instance=form_instance)

        viewer = UserFactory.create()
        self.investigation.add_user(viewer, "V")
        self.client.force_login(viewer)

        response = self.client.post(url_for_response(form_response), data={"json__name": "Escher"})
        self.assertEqual(response.status_code, 403)

        updated_response = FormResponse.objects.get(id=form_response.id)
        self.assertEqual(updated_response.json["name"], "Gödel")

    def test_edit(self):
        form_instance = self.make_singe_step_instance({"name": {"type": "string"}})
        form_response = FormResponseFactory.create(json={"name": "Gödel"}, form_instance=form_instance)

        response = self.client.post(url_for_response(form_response), data={"json__name": "Escher"})
        self.assertEqual(response.status_code, 302)

        updated_response = FormResponse.objects.get(id=form_response.id)
        self.assertEqual(updated_response.json["name"], "Escher")

    def test_edit_non_existing_field(self):
        properties = {"name": {"type": "string"}}
        form_instance = self.make_singe_step_instance(properties)
        form_response = FormResponseFactory.create(json={"name": "Gödel"}, form_instance=form_instance)

        response = self.client.post(url_for_response(form_response), data={"json__color": "Red"})
        self.assertEqual(response.status_code, 400)

        updated_response = FormResponse.objects.get(id=form_response.id)
        self.assertDictEqual(updated_response.json, {"name": "Gödel"})

    def test_add_new_field_to_response(self):
        properties = {"name": {"type": "string"}, "color": {"type": "string"}}
        form_instance = self.make_singe_step_instance(properties)
        form_response = FormResponseFactory.create(json={"name": "Gödel"}, form_instance=form_instance)

        response = self.client.post(url_for_response(form_response), data={"json__color": "Red"})
        self.assertEqual(response.status_code, 302)

        updated_response = FormResponse.objects.get(id=form_response.id)
        self.assertDictEqual(updated_response.json, {"name": "Gödel", "color": "Red"})

    def test_with_json_schema(self):
        properties = {"email": {"type": "string", "format": "email"}}
        form_instance = self.make_singe_step_instance(properties)
        form_response = FormResponseFactory.create(json={"email": "test@example.com"}, form_instance=form_instance)

        response = self.client.post(url_for_response(form_response), data={"json__email": "not an email address"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.content, b"'not an email address' is not a 'email'")

        updated_response = FormResponse.objects.get(id=form_response.id)
        self.assertDictEqual(updated_response.json, {"email": "test@example.com"})

