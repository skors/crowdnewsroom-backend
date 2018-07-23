from django.urls import reverse
from rest_framework.test import APITestCase

from forms.models import Tag
from forms.tests.factories import UserFactory, InvestigationFactory, TagFactory


def make_url(investigation):
    params = {
        "investigation_slug": investigation.slug
    }

    return reverse("investigation_assignees", kwargs=params)


class AssigneeAPITest(APITestCase):
    def setUp(self):
        self.investigation_owner = UserFactory.create()
        self.investigation = InvestigationFactory.create()
        self.investigation.add_user(self.investigation_owner, "O")

    def test_get_tags_requires_authentication(self):
        response = self.client.get(make_url(self.investigation))
        # should really be a 401...
        self.assertEqual(response.status_code, 403)

    def test_list_with_results(self):
        other_investigation = InvestigationFactory.create()
        other_investigation.add_user(self.investigation_owner, "O")

        self.client.force_login(self.investigation_owner)

        response = self.client.get(make_url(self.investigation))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [
            {
                "first_name": self.investigation_owner.first_name,
                "last_name": self.investigation_owner.last_name,
                "id": self.investigation_owner.id,
                "email": self.investigation_owner.email
            }
        ])

    def test_list_fails_if_unauthorized(self):
        other_investigation = InvestigationFactory.create()

        self.client.force_login(self.investigation_owner)

        response = self.client.get(make_url(other_investigation))
        self.assertEqual(response.status_code, 403)
