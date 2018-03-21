from django.test import TestCase
from forms.models import Investigation, UserGroup


class UserGroupTestCase(TestCase):
    def test_create_groups(self):
        user_groups = UserGroup.objects.all()
        self.assertEqual(len(user_groups), 0, "at the beginning there should be no groups")

        Investigation.objects.create(name="example investigation")

        user_groups = UserGroup.objects.all()
        self.assertEqual(len(user_groups), 5, "should create one group for each role")
