from django.core.management.base import BaseCommand
from datetime import date, timedelta
from decimal import Decimal as D

from crm.models import (
    Client,
    LedgerEntry,
    Goal,
    Policy,
    ComplianceDocument,
    Claim,
    ClaimSceneItem,
    ClaimLogEntry,
)

TODAY = date.today()


def rel(days):
    return TODAY + timedelta(days=days)


class Command(BaseCommand):
    help = 'Seeds a realistic South African private wealth practice register (FSP 29370)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Delete existing CRM records before seeding.',
        )

    def handle(self, *args, **options):
        if options.get('reset'):
            self.stdout.write(self.style.WARNING('Clearing existing CRM records...'))
            Claim.objects.all().delete()
            Client.objects.all().delete()
        elif Client.objects.exists():
            self.stdout.write(self.style.WARNING('Database already contains records. Re-run with --reset to reseed.'))
            return

        self.stdout.write('Seeding Royal Square Financial practice register...')

        # ------------------------------------------------------------------ #
        # 1. Dr Sipho Bheki Dlamini — Sandton HNW, discretionary mandate
        # ------------------------------------------------------------------ #
        c1 = Client.objects.create(
            reference="CLI-1024", title="Dr", first_name="Sipho", second_name="Bheki", surname="Dlamini",
            id_number="8403125289081", date_of_birth=date(1984, 3, 12),
            licence_expiry=rel(25), next_review_date=rel(10), client_since=date(2018, 5, 14),
            occupation="Chief Technology Officer", employer="Naspers Fintech",
            annual_income=D("2400000.00"), mobile_number="+27 82 555 1234",
            email_address="sipho.dlamini@naspers.com",
            primary_address="14 Saxon Road, Sandhurst, Sandton, 2196",
            risk_profile="MODERATE", risk_score=68,
        )
        LedgerEntry.objects.bulk_create([
            LedgerEntry(client=c1, category="ASSET", label="Primary Residence (Sandhurst)", amount=D("6500000.00")),
            LedgerEntry(client=c1, category="ASSET", label="Allan Gray Balanced Fund", amount=D("3200000.00")),
            LedgerEntry(client=c1, category="ASSET", label="Coronation Top 20 Equity", amount=D("1850000.00")),
            LedgerEntry(client=c1, category="ASSET", label="Ninety One Global Franchise Feeder", amount=D("1420000.00")),
            LedgerEntry(client=c1, category="LIABILITY", label="Standard Bank Home Loan", amount=D("2100000.00"), creditor="Standard Bank", interest_rate=D("11.25")),
            LedgerEntry(client=c1, category="LIABILITY", label="WesBank Vehicle Finance (BMW X5)", amount=D("450000.00"), creditor="WesBank", interest_rate=D("12.50")),
            LedgerEntry(client=c1, category="INCOME", label="Monthly Net Remuneration", amount=D("135000.00")),
            LedgerEntry(client=c1, category="INCOME", label="Rental Income (Rosebank Apartment)", amount=D("12500.00")),
            LedgerEntry(client=c1, category="EXPENSE", label="Bond & Vehicle Repayments", amount=D("38000.00")),
            LedgerEntry(client=c1, category="EXPENSE", label="Living & Schooling Expenses", amount=D("45000.00")),
        ])
        Goal.objects.bulk_create([
            Goal(client=c1, name="Early Retirement at 55", kind="RETIREMENT", target_amount=D("25000000.00"), current_amount=D("5050000.00"), monthly_contribution=D("30000.00"), start_date=date(2018, 5, 14), target_date=date(2039, 3, 12), vehicle="Retirement Annuity"),
            Goal(client=c1, name="Children University Overseas Fund", kind="EDUCATION", target_amount=D("3000000.00"), current_amount=D("1200000.00"), monthly_contribution=D("15000.00"), start_date=date(2020, 1, 1), target_date=date(2030, 1, 1), vehicle="Unit Trust"),
        ])
        Policy.objects.bulk_create([
            Policy(client=c1, provider="Discovery Life", product_type="Life & Severe Illness Cover", policy_number="DL-10948501", sum_assured=D("10000000.00"), monthly_premium=D("3450.00"), renewal_date=rel(120)),
            Policy(client=c1, provider="Santam", product_type="Comprehensive Executive Personal Lines", policy_number="ST-39201984", sum_assured=D("8000000.00"), monthly_premium=D("2800.00"), renewal_date=rel(90)),
            Policy(client=c1, provider="Allan Gray", product_type="Retirement Annuity Portfolio", policy_number="AG-RA-49910", sum_assured=D("6450000.00"), monthly_premium=D("12500.00"), renewal_date=rel(210)),
            Policy(client=c1, provider="Discovery Health", product_type="Executive Plan + Gap Top-up", policy_number="DH-9910472", sum_assured=D("0.00"), monthly_premium=D("11200.00"), renewal_date=date(TODAY.year, 12, 31)),
        ])
        ComplianceDocument.objects.bulk_create([
            ComplianceDocument(client=c1, type="ID", signed_on=date(2022, 1, 15), storage_key="docs/c1/id.pdf"),
            ComplianceDocument(client=c1, type="PROOF_OF_RESIDENCE", signed_on=rel(-40), storage_key="docs/c1/utility.pdf"),
            ComplianceDocument(client=c1, type="CONSENT", signed_on=rel(-380), storage_key="docs/c1/consent.pdf"),
        ])

        # ------------------------------------------------------------------ #
        # 2. Mrs Ansie Van Der Merwe — Stellenbosch agribusiness, conservative
        # ------------------------------------------------------------------ #
        c2 = Client.objects.create(
            reference="CLI-1025", title="Mrs", first_name="Ansie", second_name="Maria", surname="Van Der Merwe",
            id_number="7608190123087", date_of_birth=date(1976, 8, 19),
            licence_expiry=rel(400), next_review_date=rel(180), client_since=date(2015, 11, 3),
            occupation="Managing Director", employer="Boland Agribusiness Pty Ltd",
            annual_income=D("1850000.00"), mobile_number="+27 83 902 4411",
            email_address="ansie@bolandagri.co.za",
            primary_address="De Rust Farm, R44, Stellenbosch, 7600",
            risk_profile="CONSERVATIVE", risk_score=42,
        )
        LedgerEntry.objects.bulk_create([
            LedgerEntry(client=c2, category="ASSET", label="Stellenbosch Wine & Fruit Holding", amount=D("14000000.00")),
            LedgerEntry(client=c2, category="ASSET", label="Sanlam Fixed Return Endowment", amount=D("4200000.00")),
            LedgerEntry(client=c2, category="ASSET", label="Momentum Preservation Fund", amount=D("2650000.00")),
            LedgerEntry(client=c2, category="LIABILITY", label="Land Bank Agro Facility", amount=D("3100000.00"), creditor="Land Bank", interest_rate=D("10.50")),
            LedgerEntry(client=c2, category="INCOME", label="Monthly Director Draw", amount=D("110000.00")),
            LedgerEntry(client=c2, category="EXPENSE", label="Operational & Personal Living", amount=D("52000.00")),
        ])
        Goal.objects.bulk_create([
            Goal(client=c2, name="Farm Succession Liquidity", kind="WEALTH", target_amount=D("8000000.00"), current_amount=D("4200000.00"), monthly_contribution=D("25000.00"), start_date=date(2016, 3, 1), target_date=date(2032, 3, 1), vehicle="Endowment"),
        ])
        Policy.objects.bulk_create([
            Policy(client=c2, provider="Sanlam Life Ltd", product_type="Keyperson & Buy/Sell Assurance", policy_number="SL-88401928", sum_assured=D("12500000.00"), monthly_premium=D("6420.00"), renewal_date=rel(150)),
            Policy(client=c2, provider="Santam", product_type="Commercial Multi-Hazard & Cyber", policy_number="COM-99120", sum_assured=D("22000000.00"), monthly_premium=D("9850.00"), renewal_date=rel(60)),
            Policy(client=c2, provider="Old Mutual Wealth", product_type="Fixed Return Endowment", policy_number="OMW-33921", sum_assured=D("4200000.00"), monthly_premium=D("18000.00"), renewal_date=rel(300)),
        ])
        ComplianceDocument.objects.bulk_create([
            ComplianceDocument(client=c2, type="ID", signed_on=date(2021, 6, 2), storage_key="docs/c2/id.pdf"),
            ComplianceDocument(client=c2, type="PROOF_OF_RESIDENCE", signed_on=rel(-55), storage_key="docs/c2/utility.pdf"),
            ComplianceDocument(client=c2, type="CONSENT", signed_on=rel(-95), storage_key="docs/c2/consent.pdf"),
            ComplianceDocument(client=c2, type="ADVICE_RECORD", signed_on=rel(-120), storage_key="docs/c2/roa.pdf"),
        ])

        # ------------------------------------------------------------------ #
        # 3. Mr Kagiso Mokoena — Nexura Tech, corporate + personal mandate
        # ------------------------------------------------------------------ #
        c3 = Client.objects.create(
            reference="CLI-1026", title="Mr", first_name="Kagiso", second_name="Tumelo", surname="Mokoena",
            id_number="8406125291088", date_of_birth=date(1984, 6, 12),
            licence_expiry=rel(540), next_review_date=rel(-6), client_since=date(2019, 1, 14),
            occupation="Managing Director", employer="Nexura Tech Solutions (Pty) Ltd",
            annual_income=D("3400000.00"), mobile_number="+27 82 441 9021",
            email_address="kagiso@nexuratech.co.za",
            primary_address="8 Rivonia Grove, Sandton, 2196",
            risk_profile="AGGRESSIVE", risk_score=81,
        )
        LedgerEntry.objects.bulk_create([
            LedgerEntry(client=c3, category="ASSET", label="Primary Residence & Pleasure Craft", amount=D("8500000.00")),
            LedgerEntry(client=c3, category="ASSET", label="Investments & Retirement Annuity", amount=D("11200000.00")),
            LedgerEntry(client=c3, category="LIABILITY", label="Nedbank Bond", amount=D("1250000.00"), creditor="Nedbank", interest_rate=D("11.75")),
            LedgerEntry(client=c3, category="INCOME", label="Director Remuneration & Dividends", amount=D("205000.00")),
            LedgerEntry(client=c3, category="EXPENSE", label="Household, School & Vehicle Costs", amount=D("78000.00")),
        ])
        Goal.objects.bulk_create([
            Goal(client=c3, name="Business Exit Capital Target", kind="WEALTH", target_amount=D("40000000.00"), current_amount=D("11200000.00"), monthly_contribution=D("60000.00"), start_date=date(2019, 1, 14), target_date=date(2035, 1, 1), vehicle="Discretionary Share Portfolio"),
            Goal(client=c3, name="Education Endowment Fund", kind="EDUCATION", target_amount=D("1500000.00"), current_amount=D("1410000.00"), monthly_contribution=D("9500.00"), start_date=date(2018, 2, 1), target_date=date(2026, 2, 1), vehicle="Endowment"),
        ])
        Policy.objects.bulk_create([
            Policy(client=c3, provider="Liberty Corporate", product_type="Corporate Keyperson & Buy/Sell", policy_number="LIB-KP-991", sum_assured=D("15000000.00"), monthly_premium=D("8200.00"), renewal_date=rel(130)),
            Policy(client=c3, provider="Santam Insurance", product_type="Executive Domestic & Craft (Motor)", policy_number="POL-SAN-88301-B", sum_assured=D("8500000.00"), monthly_premium=D("6750.00"), renewal_date=rel(26)),
            Policy(client=c3, provider="Ninety One Asset Mgt", product_type="Offshore Global Franchise Feeder", policy_number="91-GL-00281", sum_assured=D("4750000.00"), monthly_premium=D("0.00"), renewal_date=rel(160)),
            Policy(client=c3, provider="Discovery Life", product_type="Severe Illness & Income Shield", policy_number="DL-10948502", sum_assured=D("4800000.00"), monthly_premium=D("3980.00"), renewal_date=rel(190)),
        ])
        ComplianceDocument.objects.bulk_create([
            ComplianceDocument(client=c3, type="ID", signed_on=date(2019, 1, 14), storage_key="docs/c3/id.pdf"),
            ComplianceDocument(client=c3, type="PROOF_OF_RESIDENCE", signed_on=rel(-70), storage_key="docs/c3/utility.pdf"),
            ComplianceDocument(client=c3, type="CONSENT", signed_on=rel(-350), storage_key="docs/c3/consent.pdf"),
        ])

        # ------------------------------------------------------------------ #
        # 4. Ms Naledi Khumalo — licence expiring, Discovery Insure motor
        # ------------------------------------------------------------------ #
        c4 = Client.objects.create(
            reference="CLI-1027", title="Ms", first_name="Naledi", second_name="Zanele", surname="Khumalo",
            id_number="9002145123084", date_of_birth=date(1990, 2, 14),
            licence_expiry=rel(14), next_review_date=rel(48), client_since=date(2021, 9, 8),
            occupation="Specialist Anaesthetist", employer="Netcare Milpark",
            annual_income=D("2950000.00"), mobile_number="+27 84 220 7712",
            email_address="n.khumalo@medpractice.co.za",
            primary_address="21 Killarney Mews, Johannesburg, 2193",
            risk_profile="MODERATE", risk_score=61,
        )
        LedgerEntry.objects.bulk_create([
            LedgerEntry(client=c4, category="ASSET", label="Killarney Sectional Title", amount=D("3400000.00")),
            LedgerEntry(client=c4, category="ASSET", label="Discovery Invest Retirement Annuity", amount=D("2150000.00")),
            LedgerEntry(client=c4, category="LIABILITY", label="Absa Home Loan", amount=D("1650000.00"), creditor="Absa", interest_rate=D("11.00")),
            LedgerEntry(client=c4, category="INCOME", label="Practice Distribution", amount=D("164000.00")),
            LedgerEntry(client=c4, category="EXPENSE", label="Household & Practice Costs", amount=D("61000.00")),
        ])
        Policy.objects.bulk_create([
            Policy(client=c4, provider="Discovery Insure", product_type="Comprehensive Motor & Household", policy_number="DIS-INS-55210", sum_assured=D("1850000.00"), monthly_premium=D("3120.00"), renewal_date=rel(40)),
            Policy(client=c4, provider="Discovery Life", product_type="Income Protection & Disability", policy_number="DL-77219", sum_assured=D("6000000.00"), monthly_premium=D("4310.00"), renewal_date=rel(220)),
        ])
        ComplianceDocument.objects.bulk_create([
            ComplianceDocument(client=c4, type="ID", signed_on=date(2021, 9, 8), storage_key="docs/c4/id.pdf"),
            ComplianceDocument(client=c4, type="CONSENT", signed_on=rel(-60), storage_key="docs/c4/consent.pdf"),
        ])

        # ------------------------------------------------------------------ #
        # 5. Adv. Johan van der Merwe — commission + retainer mandate
        # ------------------------------------------------------------------ #
        c5 = Client.objects.create(
            reference="CLI-1028", title="Adv", first_name="Johan", second_name="Petrus", surname="van der Merwe",
            id_number="6412095034081", date_of_birth=date(1964, 12, 9),
            licence_expiry=rel(700), next_review_date=rel(95), client_since=date(2012, 4, 2),
            occupation="Senior Counsel", employer="Johannesburg Bar",
            annual_income=D("4100000.00"), mobile_number="+27 82 555 1928",
            email_address="jvdm@sandtonchambers.co.za",
            primary_address="6 Bryanston Drive, Bryanston, 2191",
            risk_profile="CONSERVATIVE", risk_score=38,
        )
        LedgerEntry.objects.bulk_create([
            LedgerEntry(client=c5, category="ASSET", label="Bryanston Residence", amount=D("9200000.00")),
            LedgerEntry(client=c5, category="ASSET", label="Living Annuity (Glacier)", amount=D("12800000.00")),
            LedgerEntry(client=c5, category="ASSET", label="Momentum Corporate Preservation", amount=D("3350000.00")),
            LedgerEntry(client=c5, category="LIABILITY", label="Investec Private Facility", amount=D("900000.00"), creditor="Investec", interest_rate=D("10.25")),
            LedgerEntry(client=c5, category="INCOME", label="Chambers Fee Income", amount=D("245000.00")),
            LedgerEntry(client=c5, category="EXPENSE", label="Chambers & Household Costs", amount=D("96000.00")),
        ])
        Goal.objects.bulk_create([
            Goal(client=c5, name="Estate Liquidity Provision", kind="WEALTH", target_amount=D("6000000.00"), current_amount=D("4920000.00"), monthly_contribution=D("18000.00"), start_date=date(2014, 1, 1), target_date=date(2028, 1, 1), vehicle="Living Annuity"),
        ])
        Policy.objects.bulk_create([
            Policy(client=c5, provider="Sanlam Glacier", product_type="Living Annuity (LISP)", policy_number="POL-GL-9481902", sum_assured=D("12800000.00"), monthly_premium=D("0.00"), renewal_date=rel(280)),
            Policy(client=c5, provider="Momentum Corporate", product_type="Preservation Fund", policy_number="MOM-PR-4471", sum_assured=D("3350000.00"), monthly_premium=D("0.00"), renewal_date=rel(320)),
        ])
        ComplianceDocument.objects.bulk_create([
            ComplianceDocument(client=c5, type="ID", signed_on=date(2012, 4, 2), storage_key="docs/c5/id.pdf"),
            ComplianceDocument(client=c5, type="PROOF_OF_RESIDENCE", signed_on=rel(-30), storage_key="docs/c5/utility.pdf"),
            ComplianceDocument(client=c5, type="CONSENT", signed_on=rel(-20), storage_key="docs/c5/consent.pdf"),
            ComplianceDocument(client=c5, type="ADVICE_RECORD", signed_on=rel(-25), storage_key="docs/c5/roa.pdf"),
        ])

        # ------------------------------------------------------------------ #
        # Claims register
        # ------------------------------------------------------------------ #
        claim1 = Claim.objects.create(
            client=c3, reference="CLM-2025-0842", insurer="Santam", policy_number="POL-SAN-88301-B",
            insurer_claim_number="ST-99104", claims_handler="Marius Louw (+27 11 100 9283)",
            claim_type="MOTOR_ACCIDENT", incident_date=rel(-9), lodged_date=rel(-9),
            description=(
                "Intersection collision at Cnr Rivonia Road & Sandton Drive, Sandton Central, 08:15 in clear, dry "
                "conditions. Third party executed an unauthorised right turn across the insured lane. Front quarter, "
                "suspension strut and sensor harness damaged; vehicle immobilised."
            ),
            stage="DECISION",
        )
        ClaimSceneItem.objects.bulk_create([
            ClaimSceneItem(claim=claim1, item="PHOTOS"),
            ClaimSceneItem(claim=claim1, item="POLICE_REPORT"),
            ClaimSceneItem(claim=claim1, item="WITNESS_DETAILS"),
            ClaimSceneItem(claim=claim1, item="DAMAGE_ESTIMATE"),
        ])
        ClaimLogEntry.objects.bulk_create([
            ClaimLogEntry(claim=claim1, text="FNOL captured telephonically and cross-referenced on Santam Broker Connect."),
            ClaimLogEntry(claim=claim1, text="SAPS AR 442/09 case number lodged at Sandton Police Station within the 48-hour window."),
            ClaimLogEntry(claim=claim1, text="Vehicle inspected at the Santam drive-in assessment centre; digitised chassis scan completed."),
            ClaimLogEntry(claim=claim1, text="Total damage schedule approved at R 68,400.00 (standard excess R 4,500)."),
            ClaimLogEntry(claim=claim1, text="Repair quote submitted by Sandton Auto Body (Pty) Ltd, a BMW-approved repair facility."),
            ClaimLogEntry(claim=claim1, text="Insurer authorisation letter issued; excess waiver validation in process."),
        ])

        claim2 = Claim.objects.create(
            client=c1, reference="CLM-2025-0811", insurer="Santam", policy_number="ST-39201984",
            insurer_claim_number="ST-88129", claims_handler="Eileen Botha",
            claim_type="MOTOR_ACCIDENT", incident_date=rel(-18), lodged_date=rel(-17),
            description="Collision with a stationary obstacle at a garage exit. Front bumper and right sensor housing damaged.",
            stage="ASSESSMENT",
        )
        ClaimSceneItem.objects.bulk_create([
            ClaimSceneItem(claim=claim2, item="PHOTOS"),
            ClaimSceneItem(claim=claim2, item="DAMAGE_ESTIMATE"),
        ])
        ClaimLogEntry.objects.bulk_create([
            ClaimLogEntry(claim=claim2, text="Claim registered on the Santam online broker portal."),
            ClaimLogEntry(claim=claim2, text="Assessor Eileen Botha appointed to inspect the vehicle at Renew-It Sandton."),
            ClaimLogEntry(claim=claim2, text="Stage advanced to ASSESSMENT."),
        ])

        claim3 = Claim.objects.create(
            client=c4, reference="CLM-2025-0798", insurer="Discovery Insure", policy_number="DIS-INS-55210",
            insurer_claim_number="DI-44120", claims_handler="Thabo Nkosi",
            claim_type="MOTOR_ACCIDENT", incident_date=rel(-26), lodged_date=rel(-25),
            description="Hail damage to roof and bonnet panels sustained during the Johannesburg storm cell.",
            stage="DOCS_REQUESTED",
        )
        ClaimSceneItem.objects.bulk_create([ClaimSceneItem(claim=claim3, item="PHOTOS")])
        ClaimLogEntry.objects.bulk_create([
            ClaimLogEntry(claim=claim3, text="Claim lodged with Discovery Insure; weather event reference attached."),
            ClaimLogEntry(claim=claim3, text="Outstanding: SAPS reference not required, but panel-beater quotation requested from the client."),
        ])

        claim4 = Claim.objects.create(
            client=c2, reference="CLM-2025-0754", insurer="Santam", policy_number="COM-99120",
            insurer_claim_number="ST-77201", claims_handler="Riaan de Villiers",
            claim_type="COMMERCIAL_PROPERTY", incident_date=rel(-64), lodged_date=rel(-63),
            description="Cold-store compressor failure causing spoilage of packed export fruit stock.",
            stage="PAID",
        )
        ClaimSceneItem.objects.bulk_create([
            ClaimSceneItem(claim=claim4, item="PHOTOS"),
            ClaimSceneItem(claim=claim4, item="DAMAGE_ESTIMATE"),
            ClaimSceneItem(claim=claim4, item="INVOICES"),
        ])
        ClaimLogEntry.objects.bulk_create([
            ClaimLogEntry(claim=claim4, text="Loss adjuster appointed by Santam Commercial."),
            ClaimLogEntry(claim=claim4, text="Settlement of R 412,800.00 agreed net of the R 25,000 excess."),
            ClaimLogEntry(claim=claim4, text="Settlement paid into the client's nominated business account."),
        ])

        self.stdout.write(self.style.SUCCESS(
            f'Seeded {Client.objects.count()} clients, {Policy.objects.count()} policies and {Claim.objects.count()} claims.'
        ))
