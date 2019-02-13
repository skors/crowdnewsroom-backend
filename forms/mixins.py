from django.core.validators import RegexValidator
from slugify import slugify_de  # TODO


def slugify(value):
    return slugify_de(value, to_lower=True)


class UniqueSlugMixin(object):
    def save(self, *args, **kwargs):
        """
        Sets the slug of the instance based on the instance-method get_slug
        if the slugified name and the slug in the database aren't equal
        """
        if not self.slug:
            self.slug = slugify(self.name)
        if self.__class__.objects.exclude(pk=self.pk).filter(slug=self.slug).exists():
            self.slug = '{}-{}'.format(self.slug, str(self.pk))
        super().save(*args, **kwargs)


def validate_slug_stricter(slug):
    stricter_slug_re = '^[a-z]+[a-z0-9-]+\Z'
    error_msg = "Slugs can consist only of small case letters,\
            numbers and hyphen and should begin with a letter"
    stricter_validator = RegexValidator(stricter_slug_re, error_msg)
    stricter_validator(slug)
