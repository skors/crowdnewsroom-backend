import datetime

import pytz
from django.core.management.base import BaseCommand
import factory
import factory.fuzzy
import random

from forms.models import Investigation
from forms.tests import factories


class Command(BaseCommand):
    help = 'Create initial data'

    def create_first_investigation(self):
        investigation = factories.InvestigationFactory.create(
            name="Food Investigation")
        form = factories.FormFactory.create(name="Banana consumption",
                                            investigation=investigation)
        form_json = [
            {"schema": {
                "title": "Banana consumption",
                "slug": "banana-consumption",
                "type": "object",
                "properties": {
                    "banana_consumption": {
                        "type": "number"
                    },
                    "email": {
                        "type": "string",
                        "format": "email"
                    }
                }
            },
                "conditions": {},
                "final": True
            }
        ]
        form_instance = factories.FormInstanceFactory.create(form=form,
                                                             form_json=form_json)

        tags = [factories.TagFactory(investigation=investigation, name="yellow"),
                factories.TagFactory(investigation=investigation, name="fruit"),
                factories.TagFactory(investigation=investigation, name="tropical"),
                factories.TagFactory(investigation=investigation, name="plantain"), ]

        today = datetime.datetime.now(pytz.utc)
        a_month_ago = today - datetime.timedelta(days=30)
        for _ in range(40):
            form_response = factories.FormResponseFactory.create(
                json=factory.Dict({
                    "email": factory.Faker("safe_email"),
                    "banana_consumption": factory.fuzzy.FuzzyInteger(0, 12)}),
                form_instance=form_instance,
                status=factory.fuzzy.FuzzyChoice(["S", "V", "I"]),
                submission_date=factory.fuzzy.FuzzyDateTime(a_month_ago, today))
            form_response.tags.set([random.choice(tags), random.choice(tags)])

    def create_second_investigation(self):
        investigation = factories.InvestigationFactory.create(name="International Travel")
        form = factories.FormFactory.create(name="Travel outside of your home country",
                                            investigation=investigation)
        tags = [factories.TagFactory(investigation=investigation, name="europe"),
                factories.TagFactory(investigation=investigation, name="south america"),
                factories.TagFactory(investigation=investigation, name="north america"),
                factories.TagFactory(investigation=investigation, name="africa"),
                factories.TagFactory(investigation=investigation, name="asia"),
                factories.TagFactory(investigation=investigation, name="australia"), ]
        form_json = [
            {"schema": {
                "title": "Did you ever travel outside of your home country?",
                "slug": "travel-outside-europe",
                "type": "object",
                "properties": {
                    "traveled_outside": {
                        "type": "boolean",
                        "enumNames": ["Yes", "No"]
                    },
                }
            },
                "conditions": {},
            },
            {"schema": {
                "title": "Where to?",
                "slug": "where-to",
                "type": "object",
                "final": True,
                "properties": {
                    "farthest_destination": {
                        "type": "string"
                    },
                    "email": {
                        "type": "string",
                        "format": "email"
                    }
                }
            },
                "conditions": {"traveled_outside": {"equal": True}},
            },
            {"schema": {
                "title": "Would you like to?",
                "slug": "would-like-to-travel",
                "final": True,
                "type": "object",
                "properties": {
                    "like_to_travel": {
                        "type": "boolean"
                    },
                    "email": {
                        "type": "string",
                        "format": "email"
                    }
                }
            },
                "conditions": {"traveled_outside": {"equal": False}},
            }
        ]

        ui_json = {
            "travel-outside-europe": {
                "traveled_outside": {
                    "ui:title": "Have you ever traveled outside of your home country?",
                    "ui:widget": "buttonWidget",
                }
            },
            "where-to": {
                "farthest_destination": {
                    "ui:title": "What is the farthest destination that you have ever traveled to?",
                },
                "email": {
                    "ui:title": "Your E-Mail-Address",
                    "ui:help": "We use this if we have questions and would like to contact you later."
                }
            },
            "would-like-to-travel": {
                "like_to_travel": {
                    "ui:title": "Would you like to travel out of country at some point?",
                },
                "email": {
                    "ui:title": "Your E-Mail-Address",
                    "ui:help": "We use this if we have questions and would like to contact you later."
                }
            },

        }
        form_instance = factories.FormInstanceFactory.create(form=form,
                                                             ui_schema_json=ui_json,
                                                             form_json=form_json)

        today = datetime.datetime.now(pytz.utc)
        a_month_ago = today - datetime.timedelta(days=30)
        two_months_ago = today - datetime.timedelta(days=60)

        for _ in range(10):
            form_response = factories.FormResponseFactory.create(
                json=factory.Dict({
                    "email": factory.Faker("safe_email"),
                    "traveled_outside": False,
                    "like_to_travel": factory.fuzzy.FuzzyChoice(
                        [True, False])}),
                    form_instance=form_instance,
                    status=factory.fuzzy.FuzzyChoice(["S", "V", "I"]),
                    submission_date=factory.fuzzy.FuzzyDateTime(two_months_ago, a_month_ago))
            form_response.tags.set([random.choice(tags), random.choice(tags)])

        for _ in range(10):
            form_response = factories.FormResponseFactory.create(
                json=factory.Dict({
                    "email": factory.Faker("safe_email"),
                    "traveled_outside": True,
                    "farthest_destination": factory.Faker("country")}),
                form_instance=form_instance,
                status=factory.fuzzy.FuzzyChoice(["S", "V", "I"]),
                submission_date=factory.fuzzy.FuzzyDateTime(two_months_ago, a_month_ago))
            form_response.tags.set([random.choice(tags), random.choice(tags), random.choice(tags)])

        # At some point we realized that we forgot and important question in our form
        # so we went ahead and added a quesition. From now on all people answered
        # this new instance of the form
        second_json = form_json.copy()
        second_json[1]["schema"]["properties"]["liked-it"] = {"type": "boolean"}
        second_ui_json = ui_json.copy()
        second_ui_json["where-to"]["liked-it"] = {"ui:title": "Did you like it?"}

        second_instance = factories.FormInstanceFactory.create(form=form,
                                                               ui_schema_json=second_ui_json,
                                                               form_json=second_json)
        for _ in range(10):
            form_response = factories.FormResponseFactory.create(
                json=factory.Dict({
                    "email": factory.Faker("safe_email"),
                    "traveled_outside": False,
                    "like_to_travel": factory.fuzzy.FuzzyChoice(
                        [True, False])}),
                form_instance=second_instance,
                status=factory.fuzzy.FuzzyChoice(["S", "V", "I"]),
                submission_date=factory.fuzzy.FuzzyDateTime(a_month_ago, today))
            form_response.tags.set([random.choice(tags), random.choice(tags)])

        for _ in range(10):
            form_response = factories.FormResponseFactory.create(
                json=factory.Dict({
                    "email": factory.Faker("safe_email"),
                    "traveled_outside": True,
                    "liked-it": factory.fuzzy.FuzzyChoice([True, False]),
                    "farthest_destination": factory.Faker("country")}),
                form_instance=second_instance,
                status=factory.fuzzy.FuzzyChoice(["S", "V", "I"]),
                submission_date=factory.fuzzy.FuzzyDateTime(a_month_ago, today))
            form_response.tags.set([random.choice(tags)])

    def warn(self, string):
        self.stdout.write(self.style.WARNING(string))

    def success(self, string):
        self.stdout.write(self.style.SUCCESS(string))

    def handle(self, *args, **options):
        parts = [("food-investigation", self.create_first_investigation),
                 ("international-travel", self.create_second_investigation)]

        for slug, create_function in parts:
            investigation = Investigation.objects.filter(slug=slug).first()
            if investigation:
                self.warn("It looks like you already have a `{}` investigation (maybe from a previous run?)".format(slug))
                self.warn("should we delete and recreate it and all of the realted objects?")
                self.warn("type \"yes\" to continue")
                confirm = input()
                if confirm.lower() == "yes":
                    investigation.delete()
                    create_function()
                    self.success("Deleted and recreated the food investigation")
                else:
                    self.success("Not deleting and not recreating")
            else:
                create_function()
                self.success("Created first investigation and responses")
            self.success("\n")
