-- Baseline schema. Flyway runs this once and records it; never edit a migration
-- that has already run anywhere, add V2 instead.

create extension if not exists "pgcrypto";

create table client (
    id                            uuid primary key default gen_random_uuid(),
    reference                     varchar(12)  not null unique,
    title                         varchar(10)  not null,
    first_name                    varchar(60)  not null,
    second_name                   varchar(60),
    surname                       varchar(60)  not null,
    id_number                     varchar(13),
    date_of_birth                 date,
    licence_expiry                date,
    wedding_anniversary           date,
    next_review_date              date,
    valuation_certificate_issued  date,
    client_since                  date,
    occupation                    varchar(80),
    employer                      varchar(80),
    annual_income                 numeric(15,2),
    mobile_number                 varchar(20),
    email_address                 varchar(120),
    primary_address               varchar(200),
    risk_profile                  varchar(20)  not null default 'NOT_ASSESSED',
    risk_score                    integer,
    created_at                    timestamptz  not null,
    updated_at                    timestamptz  not null
);

create table ledger_entry (
    id             uuid primary key default gen_random_uuid(),
    client_id      uuid         not null references client(id) on delete cascade,
    category       varchar(30)  not null,
    label          varchar(120) not null,
    amount         numeric(15,2) not null,
    creditor       varchar(80),
    interest_rate  numeric(5,2),
    created_at     timestamptz  not null,
    updated_at     timestamptz  not null
);
create index idx_ledger_client on ledger_entry(client_id);

create table goal (
    id                    uuid primary key default gen_random_uuid(),
    client_id             uuid          not null references client(id) on delete cascade,
    name                  varchar(120)  not null,
    kind                  varchar(20)   not null,
    target_amount         numeric(15,2) not null,
    current_amount        numeric(15,2) not null default 0,
    monthly_contribution  numeric(15,2),
    start_date            date          not null,
    target_date           date          not null,
    vehicle               varchar(120),
    created_at            timestamptz   not null,
    updated_at            timestamptz   not null
);
create index idx_goal_client on goal(client_id);

create table policy (
    id               uuid primary key default gen_random_uuid(),
    client_id        uuid          not null references client(id) on delete cascade,
    provider         varchar(80)   not null,
    product_type     varchar(40)   not null,
    policy_number    varchar(40)   not null,
    sum_assured      numeric(15,2),
    monthly_premium  numeric(15,2),
    renewal_date     date,
    created_at       timestamptz   not null,
    updated_at       timestamptz   not null
);
create index idx_policy_client on policy(client_id);

create table compliance_document (
    id           uuid primary key default gen_random_uuid(),
    client_id    uuid        not null references client(id) on delete cascade,
    type         varchar(40) not null,
    signed_on    date        not null,
    storage_key  varchar(300),
    created_at   timestamptz not null,
    updated_at   timestamptz not null,
    constraint uq_document_per_client unique (client_id, type)
);

create table claim (
    id                    uuid primary key default gen_random_uuid(),
    client_id             uuid        not null references client(id),
    reference             varchar(30) not null unique,
    insurer               varchar(80) not null,
    policy_number         varchar(40),
    insurer_claim_number  varchar(40),
    claims_handler        varchar(120),
    claim_type            varchar(60) not null,
    incident_date         date        not null,
    lodged_date           date        not null,
    description           varchar(2000),
    stage                 varchar(30) not null default 'REGISTERED',
    created_at            timestamptz not null,
    updated_at            timestamptz not null
);
create index idx_claim_client on claim(client_id);

create table claim_scene_item (
    claim_id  uuid        not null references claim(id) on delete cascade,
    item      varchar(40) not null,
    primary key (claim_id, item)
);

create table claim_log_entry (
    id           uuid primary key default gen_random_uuid(),
    claim_id     uuid         not null references claim(id) on delete cascade,
    text         varchar(500) not null,
    recorded_at  timestamptz  not null
);

create table reminder_dismissal (
    id            uuid primary key default gen_random_uuid(),
    reminder_key  varchar(200) not null unique,
    created_at    timestamptz  not null,
    updated_at    timestamptz  not null
);
