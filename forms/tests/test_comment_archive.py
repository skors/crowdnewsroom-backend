import pytz
from django.test import TestCase, Client
from django.urls import reverse
from django.utils import timezone
from unittest.mock import patch

from forms.models import Comment, UserGroup, User, INVESTIGATION_ROLES
from forms.tests.factories import UserFactory, CommentFactory,\
    FormResponseFactory, FormInstanceFactory


def make_url(comment):
    form_response = comment.form_response
    form = form_response.form_instance.form
    params = {
        "form_slug": form.slug,
        "investigation_slug": form.investigation.slug,
        "response_id": form_response.id,
        "comment_id": comment.id
    }

    return reverse("comment_delete", kwargs=params)


def make_url_for_response_list(form, bucket):
    params = {
        "investigation_slug": form.investigation.slug,
        "form_slug": form.slug,
        "bucket": bucket
    }
    return reverse("form_responses", kwargs=params)


class FormReponseAssigneesTest(TestCase):
    def setUp(self):
        self.user1 = UserFactory.create()
        self.user2 = UserFactory.create()
        self.user3 = UserFactory.create()
        self.comment = CommentFactory.create(author=self.user1)

        admin_user_group = UserGroup.objects.filter(investigation=self.comment.form_response.form_instance.form.investigation,
                                                    role=INVESTIGATION_ROLES.ADMIN).first()
        admin_user_group.group.user_set.add(self.user1)
        admin_user_group.group.user_set.add(self.user2)

        self.client = Client()

    def test_delete_own_comment(self):
        self.client.force_login(self.user1)

        payload = {
            "archived": True,
            "text": self.comment.text
        }
        response = self.client.post(make_url(self.comment), data=payload)
        self.assertEqual(response.status_code, 302)

        updated_comment = Comment.objects.get(id=self.comment.id)
        self.assertEqual(updated_comment.archived, True)

    def test_delete_other_persons_comment_fails(self):
        self.client.force_login(self.user2)

        payload = {
            "archived": True,
            "text": self.comment.text
        }
        response = self.client.post(make_url(self.comment), data=payload)
        self.assertEqual(response.status_code, 403)

        updated_comment = Comment.objects.get(id=self.comment.id)
        self.assertEqual(updated_comment.archived, False)

    def test_delete_other_investigation_comment_fails(self):
        self.client.force_login(self.user3)

        payload = {
            "archived": True,
            "text": self.comment.text
        }
        response = self.client.post(make_url(self.comment), data=payload)
        self.assertEqual(response.status_code, 403)

        updated_comment = Comment.objects.get(id=self.comment.id)
        self.assertEqual(updated_comment.archived, False)


class FormReponseListTest(TestCase):
    def setUp(self):
        self.user = UserFactory.create()
        self.form_instance = FormInstanceFactory.create()
        self.form_response1 = FormResponseFactory.create(form_instance=self.form_instance)
        self.form_response2 = FormResponseFactory.create(form_instance=self.form_instance)
        self.comment1 = CommentFactory.create(author=self.user, text="bla",
                                              date=timezone.datetime(2018, 1, 12, tzinfo=pytz.utc),
                                              form_response=self.form_response1)
        self.comment2 = CommentFactory.create(author=self.user, text="blup",
                                              date=timezone.datetime(2018, 1, 15, tzinfo=pytz.utc),
                                              form_response=self.form_response1)

        User.objects.create_superuser('admin@crowdnewsroom.org', 'password')
        self.client.login(email='admin@crowdnewsroom.org', password='password')

    @patch('webpack_loader.loader.WebpackLoader.get_bundle')
    def test_deleted_comment_not_shown_in_response_list(self, *args):
        response_list = self.client.get(make_url_for_response_list(self.form_instance.form, "inbox"))
        self.assertContains(response_list, "blup", html=True)

        self.comment2.archived = True
        self.comment2.save()

        response_list = self.client.get(make_url_for_response_list(self.form_instance.form, "inbox"))
        self.assertNotContains(response_list, "blup", html=True)
        self.assertContains(response_list, "bla", html=True)
