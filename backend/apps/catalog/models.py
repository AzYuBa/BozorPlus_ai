from django.db import models


class Category(models.Model):
    slug = models.SlugField(unique=True)
    name_uz = models.CharField(max_length=128)
    name_ru = models.CharField(max_length=128, blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return self.name_uz


class Product(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="products")
    slug = models.SlugField(unique=True)
    name_uz = models.CharField(max_length=128)
    name_ru = models.CharField(max_length=128, blank=True)
    aliases = models.JSONField(default=list, blank=True)
    base_unit = models.CharField(max_length=16, default="kg")
    is_social = models.BooleanField(default=False)
    typical_pack_qty = models.DecimalField(max_digits=12, decimal_places=3, default=1)
    typical_pack_unit = models.CharField(max_length=16, default="kg")
    demo = models.BooleanField(default=False)

    class Meta:
        ordering = ["name_uz"]

    def __str__(self):
        return self.name_uz

    def all_names(self):
        names = [self.name_uz, self.name_ru, self.slug] + list(self.aliases or [])
        return [n for n in names if n]
