from django.urls import reverse
from rest_framework.test import APITestCase
from unittest import TestCase

from forms.models import UserGroup, Investigation
from forms.tests.factories import InvestigationFactory, UserFactory


class UserGroupTestCase(TestCase):
    def test_create_groups(self):
        user_groups = UserGroup.objects.all()
        self.assertEqual(len(user_groups), 0, "at the beginning there should be no groups")

        Investigation.objects.create(name="example investigation")

        user_groups = UserGroup.objects.all()
        self.assertEqual(len(user_groups), 4, "should create one group for each role")


class UserGroupAPITestCase(APITestCase):
    def test_get_users_for_usergroup_unauthorized(self):
        investigation = InvestigationFactory.create()
        response = self.client.get(reverse("user_groups", kwargs={"investigation_slug": investigation.slug, "role": "V"}))
        # TODO: This should be 401...
        self.assertEqual(response.status_code, 403)

    def test_get_users_for_usergroup_wrong_investigation(self):
        investigation = InvestigationFactory.create()
        user = UserFactory.create()
        self.client.force_login(user)

        response = self.client.get(reverse("user_groups", kwargs={"investigation_slug": investigation.slug, "role": "V"}))
        self.assertEqual(response.status_code, 403)

    def test_get_users_for_usergroup_empty(self):
        investigation = InvestigationFactory.create()
        user = UserFactory.create()

        investigation_owners = UserGroup.objects.get(investigation=investigation, role="O")
        investigation_owners.group.user_set.add(user)

        self.client.force_login(user)

        response = self.client.get(reverse("user_groups", kwargs={"investigation_slug": investigation.slug, "role": "V"}))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_get_users_for_usergroup_some(self):
        investigation = InvestigationFactory.create()
        owner = UserFactory.create()
        viewer = UserFactory.create()

        investigation_owners = UserGroup.objects.get(investigation=investigation, role="O")
        investigation_owners.group.user_set.add(owner)

        investigation_viewers = UserGroup.objects.get(investigation=investigation, role="V")
        investigation_viewers.group.user_set.add(viewer)

        self.client.force_login(owner)

        response = self.client.get(reverse("user_groups", kwargs={"investigation_slug": investigation.slug, "role": "V"}))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [{"email": viewer.email,
                                            "first_name": viewer.first_name,
                                            "last_name": viewer.last_name,
                                            "id": viewer.id}])

    def test_add_user_to_usegroup(self):
        investigation = InvestigationFactory.create()
        owner = UserFactory.create()
        viewer = UserFactory.create()

        investigation_owners = UserGroup.objects.get(investigation=investigation, role="O")
        investigation_owners.group.user_set.add(owner)

        investigation_viewers = UserGroup.objects.get(investigation=investigation, role="V")
        self.assertEqual(investigation_viewers.group.user_set.count(), 0)

        self.client.force_login(owner)

        response = self.client.post(reverse("user_groups", kwargs={"investigation_slug": investigation.slug, "role": "V"}),
                                    data={"id": viewer.id})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [{"email": viewer.email,
                                            "first_name": viewer.first_name,
                                            "last_name": viewer.last_name,
                                            "id": viewer.id}])

        self.assertEqual(investigation_viewers.group.user_set.count(), 1)

    def test_change_usergroup_for_user(self):
        investigation = InvestigationFactory.create()
        owner = UserFactory.create()
        viewer = UserFactory.create()

        investigation_owners = UserGroup.objects.get(investigation=investigation, role="O")
        investigation_owners.group.user_set.add(owner)

        investigation_viewers = UserGroup.objects.get(investigation=investigation, role="V")
        investigation_viewers.group.user_set.add(viewer)
        self.assertEqual(investigation_viewers.group.user_set.count(), 1)

        investigation_editors = UserGroup.objects.get(investigation=investigation, role="E")
        self.assertEqual(investigation_editors.group.user_set.count(), 0)

        self.client.force_login(owner)

        response = self.client.post(reverse("user_groups", kwargs={"investigation_slug": investigation.slug, "role": "E"}),
                                    data={"id": viewer.id})
        self.assertEqual(response.status_code, 200)

        self.assertEqual(investigation_viewers.group.user_set.count(), 0)
        self.assertEqual(investigation_editors.group.user_set.count(), 1)

    def test_add_user_as_editor_fails(self):
        investigation = InvestigationFactory.create()
        editor = UserFactory.create()
        viewer = UserFactory.create()

        investigation_editors = UserGroup.objects.get(investigation=investigation, role="E")
        investigation_editors.group.user_set.add(editor)
        self.assertEqual(investigation_editors.group.user_set.count(), 1)

        self.client.force_login(editor)

        response = self.client.post(reverse("user_groups", kwargs={"investigation_slug": investigation.slug, "role": "E"}),
                                    data={"id": viewer.id})
        self.assertEqual(response.status_code, 403)

        self.assertEqual(investigation_editors.group.user_set.count(), 1)

    def test_admin_cannot_manage_owners(self):
        investigation = InvestigationFactory.create()
        admin = UserFactory.create()
        viewer = UserFactory.create()

        investigation_admins = UserGroup.objects.get(investigation=investigation, role="A")
        investigation_admins.group.user_set.add(admin)

        self.client.force_login(admin)

        response = self.client.post(reverse("user_groups", kwargs={"investigation_slug": investigation.slug, "role": "O"}),
                                    data={"id": viewer.id})
        self.assertEqual(response.status_code, 403)

        investigation_owners = UserGroup.objects.get(investigation=investigation, role="O")
        self.assertEqual(investigation_owners.group.user_set.count(), 0)

    def test_owners_can_manage_owners(self):
        investigation = InvestigationFactory.create()
        owner = UserFactory.create()
        viewer = UserFactory.create()

        investigation_owners = UserGroup.objects.get(investigation=investigation, role="O")
        investigation_owners.group.user_set.add(owner)

        self.client.force_login(owner)

        response = self.client.post(reverse("user_groups", kwargs={"investigation_slug": investigation.slug, "role": "O"}),
                                    data={"id": viewer.id})
        self.assertEqual(response.status_code, 200)

        self.assertEqual(investigation_owners.group.user_set.count(), 2)
