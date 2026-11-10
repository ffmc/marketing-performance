"""Simulates Fieldnote's Salesforce marketing and sales data.

Replays deterministically from config.START to --until with a fixed seed, so any
day's files are identical across runs. Writes one JSONL file per object and day,
holding the full current state of every record that changed that day, plus an
answer key of pipeline by campaign, month and attribution model.
"""
import argparse
import csv
import json
import math
import random
import string
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import config as C

ALPHABET = string.ascii_letters + string.digits
FIRST = ["Ana", "Lucía", "Marta", "Pablo", "Javier", "Sofia", "Oliver", "Amelia", "Harry", "Isla", "James", "Emma",
         "Noah", "Ava", "Liam", "Mia", "Carlos", "Elena", "George", "Grace"]
LAST = ["García", "López", "Martín", "Ruiz", "Smith", "Jones", "Taylor", "Brown", "Wilson", "Evans", "Miller",
        "Davis", "Moore", "Clark", "Navarro", "Romero", "Walker", "Hughes", "Wright", "Hall"]
WORDS_A = ["Blue", "North", "Bright", "Quiet", "Swift", "Iron", "Green", "Clear", "Bold", "Silver", "Coral", "Amber"]
WORDS_B = ["Harbor", "Peak", "Field", "Forge", "Lane", "Grove", "Bridge", "Stone", "River", "Atlas", "Orbit", "Pine"]
WORDS_C = ["Studio", "Labs", "Partners", "Group", "Works", "Co", "Digital", "Logistics", "Health", "Media"]
INDUSTRIES = ["Technology", "Consulting", "Healthcare", "Retail", "Manufacturing", "Media", "Education"]
TOPICS = ["Roadmaps that stick", "Capacity planning", "Quarterly planning", "Remote team rituals", "Planning for agencies",
          "Resource forecasting", "OKRs in practice", "Portfolio views"]
PREFIX = {"Campaign": "701", "CampaignMember": "00v", "Lead": "00Q", "Contact": "003", "Account": "001",
          "Opportunity": "006", "OpportunityContactRole": "00K", "OpportunityHistory": "008", "User": "005"}
PATH = {"Campaign": "campaigns", "CampaignMember": "campaign_members", "Lead": "leads", "Contact": "contacts",
        "Account": "accounts", "Opportunity": "opportunities", "OpportunityContactRole": "opportunity_contact_roles",
        "OpportunityHistory": "opportunity_history", "User": "users"}


def ts(d, sec=0):
    return datetime(d.year, d.month, d.day, tzinfo=timezone.utc) + timedelta(seconds=sec)


def iso(t):
    return t.strftime("%Y-%m-%dT%H:%M:%S.000+0000")


def months_between(a, b):
    return (b.year - a.year) * 12 + b.month - a.month


class Sim:
    def __init__(self, until, first):
        self.rng = random.Random(C.SEED)
        self.until, self.first = until, first
        self.out = defaultdict(list)          # (day, path) -> json lines
        self.tasks = defaultdict(list)        # day -> [(kind, id)]
        self.dirty = {}                       # id -> object, flushed once per day
        self.db = {k: {} for k in PREFIX}     # sobject -> id -> record
        self.people = {}                      # email -> person
        self.pool = defaultdict(list)         # country -> [email]
        self.accounts_by_company = {}
        self.open_opp = {}                    # account id -> open opportunity id
        self.reps = []
        self.n_people = 0

    # ---------- helpers ----------
    def sid(self, sobject):
        return PREFIX[sobject] + "".join(self.rng.choice(ALPHABET) for _ in range(15))

    def pick(self, weights):
        r, acc = self.rng.random(), 0.0
        for k, w in weights.items():
            acc += w
            if r < acc:
                return k
        return k

    def poisson(self, lam):
        l, k, p = math.exp(-lam), 0, 1.0
        while True:
            p *= self.rng.random()
            if p <= l:
                return k
            k += 1

    def later(self, day, days, kind, oid):
        self.tasks[day + timedelta(days=self.rng.randint(*days))].append((kind, oid))

    def new(self, sobject, t, **fields):
        rec = {"attributes": {"type": sobject}, "Id": self.sid(sobject), "IsDeleted": False, "CreatedDate": iso(t), **fields}
        rec["attributes"]["url"] = f"/services/data/v61.0/sobjects/{sobject}/{rec['Id']}"
        self.db[sobject][rec["Id"]] = rec
        if sobject == "OpportunityHistory":
            rec["SystemModstamp"] = iso(t)
            self.emit(t.date(), rec)
        else:
            self.touch(rec, t)
        return rec

    def touch(self, rec, t):
        rec["LastModifiedDate"] = rec["SystemModstamp"] = iso(t)
        self.dirty[rec["Id"]] = rec

    def emit(self, day, rec):
        if self.first <= day <= self.until:
            line = json.dumps({k: v for k, v in rec.items() if not k.startswith("_")}, separators=(",", ":"), ensure_ascii=False)
            self.out[(day, "salesforce/" + PATH[rec["attributes"]["type"]])].append(line)

    def flush(self, day):
        for rec in self.dirty.values():
            self.emit(day, rec)
        self.dirty = {}

    def t(self, day):
        return ts(day, self.rng.randint(8 * 3600, 20 * 3600))

    # ---------- users and campaigns ----------
    def create_reps(self, day):
        for i in range(C.REPS):
            name = f"{self.rng.choice(FIRST)} {self.rng.choice(LAST)}"
            self.reps.append(self.new("User", ts(day), Name=name, UserRoleId="00E" + "".join(self.rng.choice(ALPHABET) for _ in range(15)),
                                      IsActive=True, Email=f"rep{i + 1}@fieldnote.example"))

    def launch_campaigns(self, day):
        for ctype, cfg in C.CAMPAIGN_TYPES.items():
            for _ in range(self.poisson(cfg["per_month"] / 30)):
                country = self.pick({k: v[1] for k, v in C.COUNTRIES.items()})
                start = day + timedelta(days=self.rng.randint(*C.PLANNING_DAYS))
                end = start + timedelta(days=self.rng.randint(*cfg["days"]) - 1)
                no_cost = self.rng.random() < C.MISSING_ALL_COST
                budget = None if no_cost else float(round(self.rng.uniform(*cfg["budget"]), -1))
                c = self.new("Campaign", self.t(day), Name=f"{start:%Y-%m} {ctype} {country} - {self.rng.choice(TOPICS)}",
                             Type=ctype, Status="Planned", StartDate=start.isoformat(), EndDate=end.isoformat(),
                             BudgetedCost=budget, ActualCost=None, ParentId=None, IsActive=True,
                             _country=country, _skip_actual=no_cost or self.rng.random() < C.MISSING_ACTUAL_COST, _members=set())
                self.tasks[start].append(("campaign_start", c["Id"]))
                self.tasks[end + timedelta(days=1)].append(("campaign_end", c["Id"]))

    # ---------- people ----------
    def respond(self, camp, day):
        cfg = C.CAMPAIGN_TYPES[camp["Type"]]
        pool = self.pool[camp["_country"]]
        if self.rng.random() < cfg["existing"]:
            if pool:
                p = self.people[self.rng.choice(pool)]
                if not p["deleted"] and p["email"] not in camp["_members"]:
                    self.existing_touch(p, camp, day)
            return
        self.new_lead(camp, day)

    def member(self, camp, day, t, lead=None, contact=None, responded=True):
        fr = day.isoformat() if responded and self.rng.random() >= C.MISSING_RESPONDED_DATE else None
        return self.new("CampaignMember", t, CampaignId=camp["Id"], LeadId=lead["Id"] if lead else None,
                        ContactId=contact["Id"] if contact else None, Status="Responded" if responded else "Sent",
                        HasResponded=responded, FirstRespondedDate=fr)

    def new_lead(self, camp, day):
        self.n_people += 1
        first, last = self.rng.choice(FIRST), self.rng.choice(LAST)
        if self.rng.random() < 0.3 and self.accounts_by_company:
            company = self.rng.choice(sorted(self.accounts_by_company))
        else:
            company = f"{self.rng.choice(WORDS_A)} {self.rng.choice(WORDS_B)} {self.rng.choice(WORDS_C)}"
        domain = company.lower().replace(" ", "")
        email = f"{first[0].lower()}.{last.lower()}{self.n_people}@{domain}.example"
        t = self.t(day)
        lead = self.lead_record(t, first, last, company, camp, email)
        p = {"email": email, "country": camp["_country"], "company": company, "lead": lead["Id"], "contact": None,
             "touches": 1, "deleted": False, "source_type": camp["Type"]}
        self.people[email] = p
        self.pool[p["country"]].append(email)
        camp["_members"].add(email)
        m = self.member(camp, day, t, lead=lead)
        lead["_members"] = [m["Id"]]
        if self.rng.random() < C.DUPLICATE_LEAD:
            dt = t + timedelta(minutes=self.rng.randint(2, 180))
            dup = self.lead_record(dt, first, last, company, camp, email)
            dm = self.member(camp, dt.date(), dt, lead=dup)
            dup["_members"] = [dm["Id"]]
            if self.rng.random() < C.DUPLICATE_MERGED:
                self.later(dt.date(), (2, 20), "delete_lead", dup["Id"])
        if self.rng.random() < C.SPAM_DELETED:
            p["deleted"] = True
            self.later(day, (1, 5), "delete_lead", lead["Id"])
        elif self.rng.random() < C.WORK[0]:
            lead["_pending"] = True
            self.later(day, C.WORK[1], "work", lead["Id"])

    def lead_record(self, t, first, last, company, camp, email):
        return self.new("Lead", t, FirstName=first, LastName=last, Email=email, Company=company, Country=camp["_country"],
                        LeadSource=camp["Type"], Status="New", IsConverted=False, ConvertedContactId=None,
                        ConvertedAccountId=None, ConvertedOpportunityId=None, ConvertedDate=None, OwnerId=self.rep()["Id"],
                        _pending=False, _members=[])

    def existing_touch(self, p, camp, day):
        t = self.t(day)
        camp["_members"].add(p["email"])
        p["touches"] += 1
        if p["contact"]:
            contact = self.db["Contact"][p["contact"]]
            self.member(camp, day, t, contact=contact)
            acc = contact["AccountId"]
            if acc not in self.open_opp and self.rng.random() < C.REPEAT_OPPORTUNITY:
                self.open_opportunity(self.db["Account"][acc], contact, camp["Id"], day, "Existing Business", p["country"])
            return
        lead = self.db["Lead"][p["lead"]]
        lead["_members"].append(self.member(camp, day, t, lead=lead)["Id"])
        if not lead["_pending"] and lead["Status"] in ("New", "Working", "Contacted", "Unqualified") and self.rng.random() < C.RECYCLE:
            lead["_pending"] = True
            self.later(day, (2, 14), "mql", lead["Id"])

    def email_sends(self, camp, day, n):
        pool = self.pool[camp["_country"]]
        for _ in range(n if pool else 0):
            p = self.people[self.rng.choice(pool)]
            if p["deleted"] or p["email"] in camp["_members"]:
                continue
            camp["_members"].add(p["email"])
            t = self.t(day)
            if p["contact"]:
                self.member(camp, day, t, contact=self.db["Contact"][p["contact"]], responded=False)
            else:
                lead = self.db["Lead"][p["lead"]]
                lead["_members"].append(self.member(camp, day, t, lead=lead, responded=False)["Id"])

    def rep(self):
        return self.rng.choice([r for r in self.reps if r["IsActive"]])

    # ---------- lead funnel ----------
    def set_status(self, lead, status, day):
        lead["Status"] = status
        self.touch(lead, self.t(day))

    def run_lead_task(self, kind, lead, day):
        if lead["IsDeleted"] or lead["IsConverted"]:
            return
        p = self.people[lead["Email"]]
        if kind == "work" and lead["Status"] == "New":
            self.set_status(lead, "Working" if day < C.STATUS_RENAME else "Contacted", day)
            mql = min(C.MQL_CAP, C.CAMPAIGN_TYPES[p["source_type"]]["mql"] + C.MQL_TOUCH_BONUS * (p["touches"] - 1))
            ok = self.rng.random() < mql
            self.later(day, C.MQL_DAYS if ok else C.UNQUALIFY_DAYS, "mql" if ok else "unqualify", lead["Id"])
        elif kind == "mql" and lead["Status"] in ("New", "Working", "Contacted", "Unqualified"):
            self.set_status(lead, "MQL", day)
            ok = self.rng.random() < C.SQL[0]
            self.later(day, C.SQL[1] if ok else C.UNQUALIFY_DAYS, "sql" if ok else "unqualify", lead["Id"])
        elif kind == "sql" and lead["Status"] == "MQL":
            self.set_status(lead, "SQL", day)
            ok = self.rng.random() < C.CONVERT[0]
            self.later(day, C.CONVERT[1] if ok else C.UNQUALIFY_DAYS, "convert" if ok else "unqualify", lead["Id"])
        elif kind == "convert" and lead["Status"] == "SQL":
            self.convert(lead, p, day)
        elif kind == "unqualify":
            self.set_status(lead, "Unqualified", day)
            lead["_pending"] = False

    def convert(self, lead, p, day):
        t = self.t(day)
        acc_id = self.accounts_by_company.get(lead["Company"])
        if acc_id:
            acc = self.db["Account"][acc_id]
        else:
            acc = self.new("Account", t, Name=lead["Company"], BillingCountry=lead["Country"], Industry=self.rng.choice(INDUSTRIES),
                           NumberOfEmployees=self.rng.choice([10, 25, 50, 120, 250, 600, 1500]), OwnerId=lead["OwnerId"])
            self.accounts_by_company[lead["Company"]] = acc["Id"]
        contact = self.new("Contact", t, AccountId=acc["Id"], FirstName=lead["FirstName"], LastName=lead["LastName"],
                           Email=lead["Email"], LeadSource=lead["LeadSource"], MailingCountry=lead["Country"])
        p["contact"] = contact["Id"]
        opp = None
        if acc["Id"] in self.open_opp:
            existing = self.db["Opportunity"][self.open_opp[acc["Id"]]]
            self.new("OpportunityContactRole", t, OpportunityId=existing["Id"], ContactId=contact["Id"], Role="Influencer", IsPrimary=False)
        else:
            members = [self.db["CampaignMember"][m] for m in lead["_members"]]
            latest = max(members, key=lambda m: m["CreatedDate"])["CampaignId"]
            opp = self.open_opportunity(acc, contact, latest, day, "New Business", lead["Country"])
        lead.update(Status="Converted", IsConverted=True, ConvertedContactId=contact["Id"], ConvertedAccountId=acc["Id"],
                    ConvertedOpportunityId=opp["Id"] if opp else None,
                    ConvertedDate=day.isoformat())
        self.touch(lead, t)
        for mid in lead["_members"]:
            m = self.db["CampaignMember"][mid]
            m["ContactId"] = contact["Id"]
            self.touch(m, t)

    # ---------- opportunities ----------
    def open_opportunity(self, acc, contact, campaign_id, day, otype, country):
        t = self.t(day)
        cur = C.COUNTRIES[country][0]
        amount = round(self.rng.lognormvariate(math.log(C.AMOUNT_MEDIAN_EUR), C.AMOUNT_SIGMA) * C.CURRENCY_FACTOR[cur], -2)
        no_role = self.rng.random() < C.NO_CONTACT_ROLE
        if no_role and self.rng.random() < C.NO_CAMPAIGN_ID:
            campaign_id = None
        opp = self.new("Opportunity", t, AccountId=acc["Id"], CampaignId=campaign_id, Name=f"{acc['Name']} - {otype}",
                       Type=otype, StageName="Discovery", Probability=C.PROBABILITY["Discovery"], Amount=amount,
                       CurrencyIsoCode=cur, CloseDate=(day + timedelta(days=C.EXPECTED_CLOSE_DAYS)).isoformat(),
                       IsClosed=False, IsWon=False, OwnerId=self.rep()["Id"], LeadSource=contact["LeadSource"],
                       _stage=0, _regress=self.rng.random() < C.REGRESS, _regressed=False)
        self.history(opp, t)
        if not no_role:
            self.new("OpportunityContactRole", t, OpportunityId=opp["Id"], ContactId=contact["Id"], Role="Decision Maker", IsPrimary=True)
        self.open_opp[acc["Id"]] = opp["Id"]
        self.schedule_stage(opp, day)
        return opp

    def history(self, opp, t):
        self.new("OpportunityHistory", t, OpportunityId=opp["Id"], StageName=opp["StageName"], Amount=opp["Amount"],
                 CloseDate=opp["CloseDate"], Probability=opp["Probability"])

    def schedule_stage(self, opp, day):
        lo, hi = C.STAGE_DAYS[opp["_stage"]]
        if self.rng.random() < C.STALL[0]:
            lo, hi = lo + C.STALL[1][0], hi + C.STALL[1][1]
        self.later(day, (lo, hi), "stage", opp["Id"])

    def run_stage(self, opp, day):
        t = self.t(day)
        s = opp["_stage"]
        if opp["_regress"] and not opp["_regressed"] and s >= 1 and self.rng.random() < 0.5:
            opp["_stage"], opp["_regressed"] = s - 1, True
            opp["StageName"] = C.STAGES[s - 1]
        elif self.rng.random() < C.LOST[s]:
            opp.update(StageName="Closed Lost", IsClosed=True, IsWon=False, CloseDate=day.isoformat())
        elif s == len(C.STAGES) - 1:
            opp.update(StageName="Closed Won", IsClosed=True, IsWon=True, CloseDate=day.isoformat())
        else:
            opp["_stage"] = s + 1
            opp["StageName"] = C.STAGES[s + 1]
            if opp["StageName"] == "Proposal" and self.rng.random() < C.AMOUNT_CHANGE[0]:
                opp["Amount"] = round(opp["Amount"] * self.rng.uniform(*C.AMOUNT_CHANGE[1]), -2)
        opp["Probability"] = C.PROBABILITY[opp["StageName"]]
        self.touch(opp, t)
        self.history(opp, t)
        if opp["IsClosed"]:
            self.open_opp.pop(opp["AccountId"], None)
        else:
            self.schedule_stage(opp, day)

    # ---------- main loop ----------
    def run_task(self, kind, oid, day):
        if kind == "campaign_start":
            c = self.db["Campaign"][oid]
            c["Status"] = "In Progress"
            self.touch(c, self.t(day))
        elif kind == "campaign_end":
            c = self.db["Campaign"][oid]
            c["Status"] = "Completed"
            if not c["_skip_actual"]:
                c["ActualCost"] = float(round(c["BudgetedCost"] * self.rng.uniform(*C.ACTUAL_COST_RANGE), 2))
            self.touch(c, self.t(day))
        elif kind == "delete_lead":
            lead = self.db["Lead"][oid]
            t = self.t(day)
            lead["IsDeleted"] = True
            self.touch(lead, t)
            for mid in lead["_members"]:
                m = self.db["CampaignMember"][mid]
                m["IsDeleted"] = True
                self.touch(m, t)
        elif kind == "stage":
            self.run_stage(self.db["Opportunity"][oid], day)
        else:
            self.run_lead_task(kind, self.db["Lead"][oid], day)

    def run(self):
        day = C.START
        while day <= self.until:
            if day == C.START:
                self.create_reps(day)
            if day == C.REP_LEAVES:
                self.reps[-1]["IsActive"] = False
                self.touch(self.reps[-1], self.t(day))
            for kind, oid in self.tasks.pop(day, []):
                self.run_task(kind, oid, day)
            self.launch_campaigns(day)
            growth = 1 + C.RESPONDER_GROWTH * months_between(C.START, day)
            for c in [c for c in self.db["Campaign"].values() if c["Status"] == "In Progress"]:
                n = self.poisson(C.CAMPAIGN_TYPES[c["Type"]]["responders"] * growth)
                for _ in range(n):
                    self.respond(c, day)
                if c["Type"] == "Email":
                    self.email_sends(c, day, n * C.EMAIL_SENT_PER_RESPONDER)
            self.flush(day)
            day += timedelta(days=1)

    # ---------- answer key ----------
    def answer_key(self):
        """Pipeline by campaign, month and attribution model, following docs/metrics.md."""
        db = self.db
        email_of = {**{i: r["Email"] for i, r in db["Lead"].items()}, **{i: r["Email"] for i, r in db["Contact"].items()}}
        touches = defaultdict(dict)            # email -> campaign -> (date, created, id)
        memberships = defaultdict(list)        # email -> [(created, id, campaign)]
        for m in db["CampaignMember"].values():
            if m["IsDeleted"]:
                continue
            email = email_of[m["ContactId"] or m["LeadId"]]
            memberships[email].append((m["CreatedDate"], m["Id"], m["CampaignId"]))
            if m["HasResponded"]:
                key = (m["FirstRespondedDate"] or m["CreatedDate"][:10], m["CreatedDate"], m["Id"])
                cur = touches[email].get(m["CampaignId"])
                if cur is None or key < cur:
                    touches[email][m["CampaignId"]] = key
        roles = defaultdict(list)
        for r in db["OpportunityContactRole"].values():
            roles[r["OpportunityId"]].append(r)

        def source(email):
            if touches[email]:
                return min((k, c) for c, k in touches[email].items())[1]
            if memberships[email]:
                return min(memberships[email])[2]
            return None

        agg = defaultdict(lambda: [0.0, 0.0, 0.0])  # (campaign, month, model, currency) -> [pipeline, won, opps]
        for o in db["Opportunity"].values():
            fallback = o["CampaignId"] or "Unattributed"
            created = o["CreatedDate"][:10]
            primary = [r for r in roles[o["Id"]] if r["IsPrimary"]]
            first = (source(email_of[primary[0]["ContactId"]]) if primary else None) or fallback
            opp_touches = sorted((k, c) for r in roles[o["Id"]] for c, k in touches[email_of[r["ContactId"]]].items() if k[0] <= created)
            credit = {
                "first_touch": [(first, 1.0)],
                "last_touch": [(opp_touches[-1][1], 1.0)] if opp_touches else [(fallback, 1.0)],
                "linear": [(c, 1 / len(opp_touches)) for _, c in opp_touches] if opp_touches else [(fallback, 1.0)],
            }
            for model, shares in credit.items():
                for camp, share in shares:
                    row = agg[(camp, created[:7] + "-01", model, o["CurrencyIsoCode"])]
                    row[0] += o["Amount"] * share
                    row[2] += share
                    if o["IsWon"]:
                        agg[(camp, o["CloseDate"][:7] + "-01", model, o["CurrencyIsoCode"])][1] += o["Amount"] * share
        return sorted((k, v) for k, v in agg.items())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--until", type=date.fromisoformat, default=date.today() - timedelta(days=1))
    ap.add_argument("--backfill", action="store_true", help="write every day's files, not only --until")
    ap.add_argument("--out", type=Path, default=Path(__file__).resolve().parent.parent / "landing")
    a = ap.parse_args()

    sim = Sim(a.until, C.START if a.backfill else a.until)
    sim.run()
    written = 0
    for (day, path), lines in sorted(sim.out.items()):
        f = a.out / path / f"{day.isoformat()}.jsonl"
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text("\n".join(lines) + "\n", encoding="utf-8")
        written += len(lines)
    gt = a.out / "ground_truth" / "campaign_pipeline_monthly.csv"
    gt.parent.mkdir(parents=True, exist_ok=True)
    with gt.open("w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["campaign_id", "month", "model", "currency", "pipeline_created", "won_revenue", "opportunities"])
        for (camp, month, model, cur), (pipe, won, n) in sim.answer_key():
            w.writerow([camp, month, model, cur, f"{pipe:.2f}", f"{won:.2f}", f"{n:.4f}"])
    print(f"{len(sim.db['Lead'])} leads, {len(sim.db['Opportunity'])} opportunities, {written} records written to {a.out}")


if __name__ == "__main__":
    main()
