import pytz
from django.test import TestCase
from django.utils import timezone

from forms.tests.factories import FormResponseFactory, FormInstanceFactory, FormFactory


class FormTest(TestCase):
    def setUp(self):
        form_instance = FormInstanceFactory.create()
        dates = [timezone.datetime(2018, 1, 2, tzinfo=pytz.utc),
                 timezone.datetime(2018, 1, 5, tzinfo=pytz.utc),
                 timezone.datetime(2018, 1, 1, tzinfo=pytz.utc),
                 timezone.datetime(2018, 1, 1, tzinfo=pytz.utc),
                 timezone.datetime(2018, 1, 1, tzinfo=pytz.utc)]

        for date in dates:
            FormResponseFactory.create(submission_date=date, form_instance=form_instance)

        self.form = form_instance.form

    def test_submissions_by_date(self):
        self.assertQuerysetEqual(self.form.submissions_by_date(),
                                 ["{'date': datetime.date(2018, 1, 1), 'c': 3}",
                                  "{'date': datetime.date(2018, 1, 2), 'c': 1}",
                                  "{'date': datetime.date(2018, 1, 5), 'c': 1}"]
                                 )

    def test_submissions_by_date_no_submissions(self):
        form = FormFactory.create()
        self.assertQuerysetEqual(form.submissions_by_date(), [])
