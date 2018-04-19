from django.test import TestCase, Client

from forms.models import User
from forms.tests.factories import FormResponseFactory, FormInstanceFactory


class FormReponseListViewTest(TestCase):
    def setUp(self):
        self.form_instance = FormInstanceFactory.create()
        for index, status in enumerate(["V", "V", "S", "S"]):
            json = {"has_car": True} if index % 2 == 0 else {}
            FormResponseFactory.create(status=status,
                                       form_instance=self.form_instance,
                                       json=json)

        User.objects.create_superuser('admin@crowdnewsroom.org', 'password')
        self.client = Client()
        self.client.login(email='admin@crowdnewsroom.org', password='password')

    def test_inbox(self):
        form = self.form_instance.form

        response = self.client.get("/forms/admin/investigations/{}/forms/{}/responses/inbox".format(form.investigation.slug, form.slug))
        self.assertEquals(len(response.context_data["formresponse_list"]), 2)

        response = self.client.get("/forms/admin/investigations/{}/forms/{}/responses/trash".format(form.investigation.slug, form.slug))
        self.assertEquals(len(response.context_data["formresponse_list"]), 0)

        response = self.client.get("/forms/admin/investigations/{}/forms/{}/responses/verified".format(form.investigation.slug, form.slug))
        self.assertEquals(len(response.context_data["formresponse_list"]), 2)

    def test_fitlers(self):
        form = self.form_instance.form

        response = self.client.get("/forms/admin/investigations/{}/forms/{}/responses/verified?has=has_car".format(form.investigation.slug, form.slug))
        self.assertEquals(len(response.context_data["formresponse_list"]), 1)


