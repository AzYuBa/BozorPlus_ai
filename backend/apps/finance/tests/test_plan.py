from apps.finance.planning import credit_readiness_score, monte_carlo


def test_kti_bounds():
    r = credit_readiness_score(True, True, "yatt", 50, 0.2, 0.1, 1.5)
    assert 0 <= r["score"] <= 100
    assert len(r["recommendations"]) == 3


def test_monte_carlo_speed_and_keys():
    out = monte_carlo(
        40_000_000,
        10_000_000,
        [{"name": "un", "qty_month": 1500, "price": 9000, "sigma": 0.08}],
        loan_payment=5_000_000,
        n=1000,
    )
    assert "p_loss" in out
    assert len(out["histogram"]) == 20
    assert 0 <= out["p_loss"] <= 1
