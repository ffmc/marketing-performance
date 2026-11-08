from datetime import date

SEED = 20240101
START = date(2024, 1, 1)
STATUS_RENAME = date(2025, 3, 1)  # Lead.Status "Working" becomes "Contacted"

COUNTRIES = {"ES": ("EUR", 0.45), "GB": ("GBP", 0.30), "US": ("USD", 0.25)}

# launches per month, active days, budget range in EUR, new responders per active day,
# share of responders who are existing people, base lead-to-MQL rate
CAMPAIGN_TYPES = {
    "Webinar":     {"per_month": 4.0, "days": (14, 28), "budget": (1500, 6000),   "responders": 2.5, "existing": 0.35, "mql": 0.30},
    "Paid Search": {"per_month": 3.0, "days": (30, 60), "budget": (4000, 15000),  "responders": 3.0, "existing": 0.15, "mql": 0.18},
    "Event":       {"per_month": 1.0, "days": (2, 5),   "budget": (8000, 30000),  "responders": 12.0, "existing": 0.40, "mql": 0.35},
    "Content":     {"per_month": 3.0, "days": (30, 90), "budget": (500, 3000),    "responders": 1.2, "existing": 0.30, "mql": 0.15},
    "Partner":     {"per_month": 1.0, "days": (30, 90), "budget": (1000, 5000),   "responders": 1.0, "existing": 0.20, "mql": 0.40},
    "Email":       {"per_month": 2.0, "days": (7, 14),  "budget": (200, 800),     "responders": 3.0, "existing": 1.00, "mql": 0.10},
}
CURRENCY_FACTOR = {"EUR": 1.0, "GBP": 0.85, "USD": 1.1}
PLANNING_DAYS = (7, 21)          # campaign created this many days before it starts
RESPONDER_GROWTH = 0.03          # per month since START
EMAIL_SENT_PER_RESPONDER = 4     # non-responding members added by email campaigns

MISSING_ACTUAL_COST = 0.15
MISSING_ALL_COST = 0.03
ACTUAL_COST_RANGE = (0.8, 1.15)

DUPLICATE_LEAD = 0.02
DUPLICATE_MERGED = 0.6
SPAM_DELETED = 0.005
MISSING_RESPONDED_DATE = 0.01

# lead funnel: probability and delay in days of each step
WORK = (0.9, (1, 5))
MQL_TOUCH_BONUS = 0.08           # per extra touch, capped at MQL_CAP
MQL_CAP = 0.8
MQL_DAYS = (3, 30)
SQL = (0.55, (3, 20))
CONVERT = (0.75, (2, 15))
UNQUALIFY_DAYS = (10, 45)
RECYCLE = 0.25                   # chance a new touch sends an open lead to MQL
REPEAT_OPPORTUNITY = 0.04        # chance a touch on a contact without an open deal opens one

NO_CONTACT_ROLE = 0.04
NO_CAMPAIGN_ID = 0.3             # of opportunities without a contact role

AMOUNT_MEDIAN_EUR = 12000
AMOUNT_SIGMA = 0.6
STAGES = ["Discovery", "Demo", "Proposal", "Negotiation"]
PROBABILITY = {"Discovery": 10, "Demo": 25, "Proposal": 50, "Negotiation": 75, "Closed Won": 100, "Closed Lost": 0}
STAGE_DAYS = [(5, 15), (7, 20), (7, 25), (5, 20)]
LOST = [0.35, 0.30, 0.25, 0.20]
STALL = (0.10, (30, 90))
REGRESS = 0.12                   # opportunities flagged to move back one stage once
AMOUNT_CHANGE = (0.4, (0.8, 1.2))  # at Proposal
EXPECTED_CLOSE_DAYS = 90

REPS = 8
REP_LEAVES = date(2025, 6, 30)   # one rep deactivated
