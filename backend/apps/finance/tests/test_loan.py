from apps.finance.calculators import annuity_payment, loan_summary


def test_annuity_matches_pmt_style():
    # Excel PMT(0.218/12, 24, -100000000)
    pmt = annuity_payment(100_000_000, 0.218, 24)
    assert 5_100_000 < pmt < 5_300_000


def test_zero_rate():
    assert annuity_payment(120_000, 0, 12) == 10_000


def test_summary_keys():
    s = loan_summary(10_000_000, 0.14, 12, "annuity", 0, 0.0)
    assert s["total_payment"] >= 10_000_000
    assert s["monthly_payment"] > 0
    assert s["source"] == "kalkulyator"
