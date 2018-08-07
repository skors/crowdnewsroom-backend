from django.urls import reverse
from rest_framework.test import APITestCase, APITransactionTestCase
from unittest.mock import patch

from forms.models import Invitation, User, INVESTIGATION_ROLES
from forms.tests.factories import InvestigationFactory, UserFactory


class InvitationAPITransactionTestCase(APITransactionTestCase):
    """ These tests rely on database functions and must therefore
        inherit from APITransactionTestCase.
        See https://stackoverflow.com/a/34801920/4099396 for more details"""
    def test_one_invitation_per_user_investigation(self):
        user = UserFactory.create()
        admin = UserFactory.create()
        investigation = InvestigationFactory.create()
        investigation.add_user(admin, INVESTIGATION_ROLES.ADMIN)

        self.client.force_login(admin)

        self.assertEqual(Invitation.objects.count(), 0)

        response = self.client.post(reverse("invitations", kwargs={"investigation_slug": investigation.slug}),
                                    data={"email": user.email})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Invitation.objects.count(), 1)

        response = self.client.post(reverse("invitations", kwargs={"investigation_slug": investigation.slug}),
                                    data={"email": user.email})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Invitation.objects.count(), 1)

    def test_cannot_invite_users_that_are_members_already(self):
        editor = UserFactory.create()
        admin = UserFactory.create()
        investigation = InvestigationFactory.create()
        investigation.add_user(admin, INVESTIGATION_ROLES.ADMIN)
        investigation.add_user(editor, INVESTIGATION_ROLES.EDITOR)

        self.client.force_login(admin)

        self.assertEqual(Invitation.objects.count(), 0)

        response = self.client.post(reverse("invitations", kwargs={"investigation_slug": investigation.slug}),
                                    data={"email": editor.email})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Invitation.objects.count(), 0)


class InvitationAPITestCase(APITestCase):
    def test_invite_user_unauthorized(self):
        investigation = InvestigationFactory.create()

        response = self.client.post(reverse("invitations", kwargs={"investigation_slug": investigation.slug}),
                                    data={"email": "journalist@example.org"})
        # This should be 401...
        self.assertEqual(response.status_code, 403)

    def test_invite_user_non_admin(self):
        editor = UserFactory.create()
        investigation = InvestigationFactory.create()
        investigation.add_user(editor, INVESTIGATION_ROLES.EDITOR)

        self.client.force_login(editor)

        response = self.client.post(reverse("invitations", kwargs={"investigation_slug": investigation.slug}),
                                    data={"email": "journalist@example.org"})
        self.assertEqual(response.status_code, 403)

    @patch("forms.models.Invitation.send_user_email")
    def test_admin_can_invite_existing_users(self, mock_send_email):
        user = UserFactory.create()
        admin = UserFactory.create()
        investigation = InvestigationFactory.create()
        investigation.add_user(admin, INVESTIGATION_ROLES.ADMIN)

        self.client.force_login(admin)

        self.assertEqual(Invitation.objects.count(), 0)

        response = self.client.post(reverse("invitations", kwargs={"investigation_slug": investigation.slug}),
                                    data={"email": user.email})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Invitation.objects.count(), 1)
        self.assertTrue(mock_send_email.called)

    @patch("forms.views.create_and_invite_user")
    def test_admin_can_invite_new_users(self, mock_invite_user):
        def create_user(*args):
            user = User()
            user.save()
            return user
        mock_invite_user.side_effect = create_user

        admin = UserFactory.create()
        investigation = InvestigationFactory.create()
        investigation.add_user(admin, INVESTIGATION_ROLES.ADMIN)

        self.client.force_login(admin)

        # The two users are: `admin` form above
        # and `AnonymousUser` from DRF
        self.assertEqual(User.objects.count(), 2)
        self.assertEqual(Invitation.objects.count(), 0)

        response = self.client.post(reverse("invitations", kwargs={"investigation_slug": investigation.slug}),
                                    data={"email": "journalist@example.org"})
        self.assertTrue(mock_invite_user.called)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Invitation.objects.count(), 1)
        self.assertEqual(User.objects.count(), 3)

    def test_invite_validates_email_address(self):
        admin = UserFactory.create()
        investigation = InvestigationFactory.create()
        investigation.add_user(admin, INVESTIGATION_ROLES.ADMIN)

        self.client.force_login(admin)

        # The two users are: `admin` form above
        # and `AnonymousUser` from DRF
        self.assertEqual(User.objects.count(), 2)
        self.assertEqual(Invitation.objects.count(), 0)

        response = self.client.post(reverse("invitations", kwargs={"investigation_slug": investigation.slug}),
                                    data={"email": "invalid@@@"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Invitation.objects.count(), 0)
        self.assertEqual(User.objects.count(), 2)

    def test_list_invitations(self):
        admin = UserFactory.create()
        user = UserFactory.create()
        investigation = InvestigationFactory.create()
        investigation.add_user(admin, INVESTIGATION_ROLES.ADMIN)

        self.client.force_login(admin)

        response = self.client.get(reverse("invitations", kwargs={"investigation_slug": investigation.slug}))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

        invitation = Invitation.objects.create(user=user, investigation=investigation)

        response = self.client.get(reverse("invitations", kwargs={"investigation_slug": investigation.slug}))
        self.assertEqual(response.data, [{"email": user.email, "id": invitation.id, "accepted": None}])

    def test_list_invitations_lists_for_investigation(self):
        admin = UserFactory.create()
        user = UserFactory.create()
        investigation = InvestigationFactory.create()
        other_investigation = InvestigationFactory.create()
        investigation.add_user(admin, INVESTIGATION_ROLES.ADMIN)

        invitation = Invitation.objects.create(user=user, investigation=investigation)
        Invitation.objects.create(user=user, investigation=other_investigation)

        self.client.force_login(admin)

        response = self.client.get(reverse("invitations", kwargs={"investigation_slug": investigation.slug}))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [{"email": user.email, "id": invitation.id, "accepted": None}])

    def test_remove_invitation(self):
        admin = UserFactory.create()
        user = UserFactory.create()

        investigation = InvestigationFactory.create()
        investigation.add_user(admin, INVESTIGATION_ROLES.ADMIN)

        invitation = Invitation.objects.create(user=user, investigation=investigation)

        self.client.force_login(admin)

        response = self.client.delete(reverse("invitation", kwargs={"invitation_id": invitation.id}))
        self.assertEqual(response.status_code, 204)
        self.assertEqual(Invitation.objects.count(), 0)

    def test_remove_wrong_investigaiton(self):
        admin = UserFactory.create()
        user = UserFactory.create()

        investigation = InvestigationFactory.create()
        other_investigation = InvestigationFactory.create()
        investigation.add_user(admin, INVESTIGATION_ROLES.ADMIN)

        invitation = Invitation.objects.create(user=user, investigation=other_investigation)

        self.client.force_login(admin)

        response = self.client.delete(reverse("invitation", kwargs={"invitation_id": invitation.id}))
        self.assertEqual(response.status_code, 403)
        self.assertEqual(Invitation.objects.count(), 1)

    def test_remove_wrong_permissions(self):
        editor = UserFactory.create()
        user = UserFactory.create()

        investigation = InvestigationFactory.create()
        investigation.add_user(editor, INVESTIGATION_ROLES.EDITOR)

        invitation = Invitation.objects.create(user=user, investigation=investigation)

        self.client.force_login(editor)

        response = self.client.delete(reverse("invitation", kwargs={"invitation_id": invitation.id}))
        self.assertEqual(response.status_code, 403)
        self.assertEqual(Invitation.objects.count(), 1)

    def test_remove_unauthorized(self):
        user = UserFactory.create()

        investigation = InvestigationFactory.create()

        invitation = Invitation.objects.create(user=user, investigation=investigation)

        response = self.client.delete(reverse("invitation", kwargs={"invitation_id": invitation.id}))
        self.assertEqual(response.status_code, 403)
        self.assertEqual(Invitation.objects.count(), 1)

    def test_list_for_user(self):
        user = UserFactory.create()
        investigation = InvestigationFactory.create()
        invitation = Invitation.objects.create(user=user, investigation=investigation)

        self.client.force_login(user)

        response = self.client.get(reverse("user_invitations"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]["id"], invitation.id)
        self.assertEqual(len(response.data), 1)

    def test_user_can_accept(self):
        user = UserFactory.create()
        investigation = InvestigationFactory.create()
        invitation = Invitation.objects.create(user=user, investigation=investigation)

        self.client.force_login(user)

        response = self.client.patch(reverse("invitation", kwargs={"invitation_id": invitation.id}),
                                     data={"accepted": True})
        self.assertEqual(response.status_code, 200)

        self.assertQuerysetEqual(investigation.get_users("V").all(), [repr(user)])

    def test_cannot_accept_invitation_for_someone_else(self):
        admin = UserFactory.create()
        user = UserFactory.create()
        investigation = InvestigationFactory.create()
        investigation.add_user(admin, INVESTIGATION_ROLES.ADMIN)

        invitation = Invitation.objects.create(user=user, investigation=investigation)

        self.client.force_login(admin)

        response = self.client.patch(reverse("invitation", kwargs={"invitation_id": invitation.id}),
                                     data={"accepted": True})
        self.assertEqual(response.status_code, 403)

        self.assertQuerysetEqual(investigation.get_users("V").all(), [])

    def test_cannot_accept_invitation_for_another_investigation(self):
        user = UserFactory.create()
        investigation = InvestigationFactory.create()
        wrong_investigation = InvestigationFactory.create()

        invitation = Invitation.objects.create(user=user, investigation=investigation)

        self.client.force_login(user)

        self.client.patch(reverse("invitation", kwargs={"invitation_id": invitation.id}),
                                     data={"investigation": {"id": wrong_investigation.id},
                                           "accepted": True},
                                     format="json")

        self.assertQuerysetEqual(wrong_investigation.get_users("V").all(), [])

    def test_cannot_change_id_of_invitation(self):
        user = UserFactory.create()
        investigation = InvestigationFactory.create()

        invitation = Invitation.objects.create(user=user, investigation=investigation)
        self.client.force_login(user)

        self.client.patch(reverse("invitation", kwargs={"invitation_id": invitation.id}),
                                     data={"id": 123})

        self.assertEqual(Invitation.objects.filter(id=123).all().count(), 0)
        self.assertEqual(Invitation.objects.filter(id=invitation.id).all().count(), 1)
