from django.urls import reverse
from rest_framework.test import APITestCase

from forms.tests.factories import UserFactory, InvestigationFactory


def make_url(investigation):
    params = {
        "investigation_slug": investigation.slug
    }

    return reverse("investigation", kwargs=params)


class InvestigationAPITest(APITestCase):
    def setUp(self):
        self.investigation_owner = UserFactory.create()
        self.investigation = InvestigationFactory.create()
        self.investigation.add_user(self.investigation_owner, "O")

    def test_delete_needs_authorization(self):
        response = self.client.delete(make_url(self.investigation))
        # should really be a 401...
        self.assertEqual(response.status_code, 403)

    def test_owner_can_delete(self):
        self.client.force_login(self.investigation_owner)

        response = self.client.delete(make_url(self.investigation))
        self.assertEqual(response.status_code, 204)

    def test_owner_cannot_delete_other_investigation(self):
        investigation = InvestigationFactory.create()

        self.client.force_login(self.investigation_owner)

        response = self.client.delete(make_url(investigation))
        self.assertEqual(response.status_code, 403)

    def test_admin_cannot_delete(self):
        admin_user = UserFactory.create()
        self.investigation.add_user(admin_user, "A")

        self.client.force_login(admin_user)
        response = self.client.delete(make_url(self.investigation))
        self.assertEqual(response.status_code, 403)

