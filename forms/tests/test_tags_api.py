from django.urls import reverse
from rest_framework.test import APITestCase

from forms.models import Tag
from forms.tests.factories import UserFactory, InvestigationFactory, TagFactory


def make_url(investigation):
    params = {
        "investigation_slug": investigation.slug
    }

    return reverse("investigation_tags", kwargs=params)


def make_details_url(tag):
    return reverse("tag_details", kwargs={"pk": tag.id})


class TagAPITest(APITestCase):
    def setUp(self):
        self.investigation_owner = UserFactory.create()
        self.investigation = InvestigationFactory.create()
        self.investigation.add_user(self.investigation_owner, "O")

    def test_get_tags_requires_authentication(self):
        response = self.client.get(make_url(self.investigation))
        # should really be a 401...
        self.assertEqual(response.status_code, 403)

    def test_list_empty(self):
        self.client.force_login(self.investigation_owner)

        response = self.client.get(make_url(self.investigation))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    def test_list_with_results(self):
        tag = TagFactory.create()
        self.investigation.tag_set.add(tag)

        other_investigation = InvestigationFactory.create()
        other_tag = TagFactory.create()
        other_investigation.tag_set.add(other_tag)

        self.client.force_login(self.investigation_owner)

        response = self.client.get(make_url(self.investigation))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [{"id": tag.id,
                                          "name": tag.name,
                                          "investigation": tag.investigation.id}])

    def test_add_tag(self):
        self.client.force_login(self.investigation_owner)

        self.assertEqual(self.investigation.tag_set.count(), 0)

        response = self.client.post(make_url(self.investigation), {"name": "Test Tag"})

        self.assertEqual(response.status_code, 201)
        self.assertEqual(self.investigation.tag_set.count(), 1)

    def test_add_tag_fails_for_unauthorized_user(self):
        other_investigation = InvestigationFactory.create()

        self.client.force_login(self.investigation_owner)

        self.assertEqual(self.investigation.tag_set.count(), 0)
        self.assertEqual(other_investigation.tag_set.count(), 0)

        response = self.client.post(make_url(other_investigation), {"name": "Test Tag"})

        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.investigation.tag_set.count(), 0)
        self.assertEqual(other_investigation.tag_set.count(), 0)

    def test_remove_tag(self):
        tag = TagFactory.create()
        self.investigation.tag_set.add(tag)

        self.client.force_login(self.investigation_owner)

        self.assertEqual(self.investigation.tag_set.count(), 1)

        response = self.client.delete(make_details_url(tag))

        self.assertEqual(response.status_code, 204)
        self.assertEqual(self.investigation.tag_set.count(), 0)

    def test_remove_tag_fails_if_unauthorized(self):
        other_user = UserFactory.create()
        tag = TagFactory.create()
        self.investigation.tag_set.add(tag)

        self.client.force_login(other_user)

        self.assertEqual(self.investigation.tag_set.count(), 1)

        response = self.client.delete(make_details_url(tag))

        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.investigation.tag_set.count(), 1)

    def test_edit_tag(self):
        tag = TagFactory.create(name="Valdi")
        self.investigation.tag_set.add(tag)

        self.client.force_login(self.investigation_owner)

        response = self.client.patch(make_details_url(tag), {"name": "Valid"})

        self.assertEqual(response.status_code, 200)
        updated_tag = Tag.objects.get(id=tag.id)
        self.assertEqual(updated_tag.name, "Valid")
