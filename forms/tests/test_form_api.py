from django.urls import reverse
from rest_framework.test import APITestCase, APITransactionTestCase
from unittest.mock import patch

from forms.models import Invitation, User, INVESTIGATION_ROLES, Form
from forms.tests.factories import InvestigationFactory, UserFactory


class FormAPITestCase(APITestCase):
    def test_add_form_unauthorized(self):
        investigation = InvestigationFactory.create()

        response = self.client.post(reverse("interviewers", kwargs={"investigation_slug": investigation.slug}),
                                    data={"name": "test", "slug": "test"})
        # This should be 401...
        self.assertEqual(response.status_code, 403)

    def test_add_form_non_admin(self):
        editor = UserFactory.create()
        investigation = InvestigationFactory.create()
        investigation.add_user(editor, INVESTIGATION_ROLES.EDITOR)

        self.client.force_login(editor)

        response = self.client.post(reverse("interviewers", kwargs={"investigation_slug": investigation.slug}),
                                    data={"name": "test", "slug": "test"})
        self.assertEqual(response.status_code, 403)

    def test_admin_can_add_form(self):
        admin = UserFactory.create()
        investigation = InvestigationFactory.create()
        investigation.add_user(admin, INVESTIGATION_ROLES.ADMIN)

        self.client.force_login(admin)

        self.assertEqual(Form.objects.count(), 0)

        response = self.client.post(reverse("interviewers", kwargs={"investigation_slug": investigation.slug}),
                                    data={"name": "test", "slug": "test"})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Form.objects.count(), 1)
        # make sure the right investigation was assigned
        self.assertEqual(response.data["investigation"], investigation.id)

    def test_wrong_admin_cannot_add_form(self):
        admin = UserFactory.create()
        investigation = InvestigationFactory.create()
        investigation.add_user(admin, INVESTIGATION_ROLES.ADMIN)
        other_investigation = InvestigationFactory()

        self.client.force_login(admin)

        self.assertEqual(Form.objects.count(), 0)

        response = self.client.post(reverse("interviewers", kwargs={"investigation_slug": other_investigation.slug}),
                                    data={"name": "test", "slug": "test"})
        self.assertEqual(response.status_code, 403)
        self.assertEqual(Form.objects.count(), 0)

