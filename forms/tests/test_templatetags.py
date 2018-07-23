from django.test import TestCase

from forms.models import INVESTIGATION_ROLES
from forms.templatetags.forms_tags import user_role_for_investigation
from forms.tests.factories import UserFactory, InvestigationFactory


class TemplateTagTest(TestCase):
    def test_user_role_for_investigation(self):
        owner = UserFactory.create()
        investigation = InvestigationFactory.create()
        investigation.add_user(owner, INVESTIGATION_ROLES.OWNER)

        self.assertEqual(user_role_for_investigation(owner, investigation), INVESTIGATION_ROLES.OWNER)

    def test_user_role_for_investigation_for_non_member(self):
        owner = UserFactory.create()
        investigation = InvestigationFactory.create()

        self.assertEqual(user_role_for_investigation(owner, investigation), None)
