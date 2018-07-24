from django.urls import reverse
from rest_framework.test import APITestCase

from forms.models import Investigation, UserGroup
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

    def test_owner_can_change_data(self):
        self.client.force_login(self.investigation_owner)

        response = self.client.patch(make_url(self.investigation), data={"name": "New Investigation Name"})
        self.assertEqual(response.status_code, 200)
        updated_investigation = Investigation.objects.get(id=self.investigation.id)
        self.assertEqual(updated_investigation.name, "New Investigation Name")

    def test_owner_can_get_data(self):
        self.client.force_login(self.investigation_owner)

        response = self.client.get(make_url(self.investigation))
        self.assertEqual(response.status_code, 200)
        expected_json = {'id': self.investigation.id,
                         'name': self.investigation.name,
                         'slug': self.investigation.slug,
                         'cover_image': None,
                         'logo': None,
                         'short_description': '',
                         'category': '',
                         'research_questions': '',
                         'status': 'D',
                         'text': '',
                         'methodology': '',
                         'faq': '',
                         'color': '',
                         'data_privacy_url': None}
        self.assertEqual(response.data, expected_json)

    def test_user_can_make_new_investigation(self):
        user = UserFactory.create()
        self.client.force_login(user)

        response = self.client.post(reverse("investigations"), {"name": "test", "slug": "test"})
        self.assertEqual(response.status_code, 201)

        new_investigation = Investigation.objects.get(slug="test")
        self.assertTrue(new_investigation)

        investigation_owners = UserGroup.objects.get(investigation=new_investigation, role="O")

        self.assertQuerysetEqual(investigation_owners.group.user_set.all(), [repr(user)])

    def test_unauthorized_cannot_make_investigation(self):
        response = self.client.post(reverse("investigations"), {"name": "test", "slug": "test"})
        self.assertEqual(response.status_code, 403)

    def test_cannot_have_same_slug_twice(self):
        user = UserFactory.create()
        self.client.force_login(user)

        response = self.client.post(reverse("investigations"), {"name": "test", "slug": self.investigation.slug})
        self.assertEqual(response.status_code, 400)

