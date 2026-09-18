from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Category, Product


@api_view(["GET"])
@permission_classes([AllowAny])
def products(request):
    q = (request.query_params.get("q") or "").strip().lower()
    qs = Product.objects.select_related("category").all()
    if q:
        matched = []
        for p in qs:
            blob = " ".join(p.all_names()).lower()
            if q in blob:
                matched.append(p)
        qs = matched
    else:
        qs = list(qs[:80])
    return Response(
        [
            {
                "id": p.id,
                "slug": p.slug,
                "name_uz": p.name_uz,
                "name_ru": p.name_ru,
                "unit": p.base_unit,
                "category": p.category.name_uz,
                "is_social": p.is_social,
                "aliases": p.aliases,
            }
            for p in qs
        ]
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def categories(request):
    return Response(
        [{"id": c.id, "slug": c.slug, "name_uz": c.name_uz} for c in Category.objects.all()]
    )
