from django.urls import path
from routing.views import (
    HealthCheckView,
    PresetsView,
    GeocodeSearchView,
    RouteCalculateView,
)

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('presets/', PresetsView.as_view(), name='presets'),
    path('geocode/', GeocodeSearchView.as_view(), name='geocode-search'),
    path('routes/calculate/', RouteCalculateView.as_view(), name='route-calculate'),
]
