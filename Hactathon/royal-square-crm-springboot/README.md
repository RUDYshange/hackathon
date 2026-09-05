# Royal Square CRM — project structure

Spring Boot 3.3 on Java 21, PostgreSQL with Flyway, and a plain
HTML/CSS/JavaScript front end served as static resources. No Node, no bundler,
no framework on the client.

## Running it

```bash
mvn spring-boot:run
```

Runtime configuration lives in `src/main/resources/application.properties`,
with local values in `.env`. The application loads the nearest `.env` on
startup, so IDE runs and `mvn spring-boot:run` use the same settings.
These environment variables are supported:

- `APP_NAME` defaults to `royal-square-crm`
- `APP_SECURITY_USER`, `APP_SECURITY_PASSWORD`, `APP_SECURITY_ROLES` configure
  the default sign-in account
- `SERVER_PORT` defaults to `8080`
- `APP_TIME_ZONE` defaults to `Africa/Johannesburg`
- `APP_LOG_LEVEL` defaults to `DEBUG`
- `DB_URL`, `DB_USER`, `DB_PASSWORD` configure PostgreSQL
- `JPA_DDL_AUTO`, `JPA_OPEN_IN_VIEW`, `HIBERNATE_FORMAT_SQL` tune JPA/Hibernate
- `FLYWAY_ENABLED`, `FLYWAY_LOCATIONS` tune Flyway
- `SERVER_ERROR_INCLUDE_MESSAGE` defaults to `always`
- `TEST_DB_URL`, `TEST_DB_DRIVER`, `TEST_JPA_DDL_AUTO`, `TEST_FLYWAY_ENABLED`
  override the test profile

The app serves the interface at `http://localhost:8080` and the API under
`/api`. Flyway creates the schema on first boot. Tests run against in-memory H2
with `./mvnw test`.

## The tree

```
royal-square-crm/
├── pom.xml
└── src/
    ├── main/
    │   ├── java/za/co/royalsquare/crm/
    │   │   ├── RoyalSquareCrmApplication.java
    │   │   ├── common/          Auditable, ApiError, exception handling
    │   │   ├── client/          Client entity, repository, service, controller
    │   │   │   └── dto/         Summary, Detail, CreateClientRequest
    │   │   ├── position/        Ledger entries, balance sheet computation
    │   │   │   └── dto/         BalanceSheet, LedgerGroup, LedgerLine
    │   │   ├── goal/            Goal tracking with pace calculation
    │   │   ├── policy/          Products in force
    │   │   ├── compliance/      Document types, expiry, gap detection
    │   │   ├── reminder/        Rules engine
    │   │   │   └── rules/       One class per rule
    │   │   └── claim/           Ten-stage pipeline, scene checklist
    │   └── resources/
    │       ├── application.properties
    │       ├── db/migration/    Flyway SQL
    │       └── static/          The front end
    │           ├── index.html
    │           ├── css/         tokens.css, app.css
    │           └── js/          api.js, router.js, format.js, ui.js, views/
    └── test/java/…              Mirrors the main tree
```

## Package by feature, not by layer

The common alternative groups everything by technical role — all controllers in
one package, all entities in another:

```
crm/
├── controller/   ClientController, ClaimController, ReminderController…
├── service/      ClientService, ClaimService…
├── repository/
├── entity/
└── dto/
```

It looks tidy and works badly. Adding a field to a client means editing five
packages, and nothing can be package-private because every collaborator lives
somewhere else. Grouping by feature keeps a change in one directory and lets
`Client.setClient()` stay package-private inside `client/`.

The rule of thumb: things that change together live together.

## Why DTOs exist

Entities and DTOs look similar enough that it is tempting to return the entity
straight from the controller. Four reasons not to, in order of how badly each
bites.

**Personal information leaks by default.** `Client` holds an ID number, an
address and, in time, medical underwriting answers. Serialising the entity puts
all of it in every response, including the list endpoint that returns two
hundred clients at once. `ClientSummaryResponse` cannot leak an ID number
because it has no field for one. Under POPIA that is the difference between a
considered design and an incident.

**Requests need different fields from responses.** If one class serves both, a
caller can POST an `id`, a `netWorth` or a `createdAt`, and you have to
remember to ignore each one. `CreateClientRequest` has no such fields, so there
is nothing to forget.

**Lazy loading breaks serialisation.** `Client.ledgerEntries` is lazy. Serialise
the entity outside a transaction and Jackson triggers a
`LazyInitializationException`; serialise it inside one and you silently fetch
the whole object graph on a list endpoint. Mapping explicitly makes the cost
visible.

**The API stops being hostage to the schema.** Renaming a column should not
break the front end. The mapper absorbs it.

DTOs are Java records — immutable, no boilerplate, and exactly right for data
with no behaviour.

## Where the calculations live

Every derived figure — net worth, monthly surplus, goal pace, document expiry,
compliance gaps — is computed on the server and arrives at the browser
finished. `format.js` formats and never calculates.

This is not tidiness. Two implementations of the same sum eventually disagree,
and a financial services product that shows one net worth on the list page and
another on the detail page has a credibility problem, not a rounding bug.

Money is `BigDecimal` with scale 2 throughout, and `numeric(15,2)` in Postgres.
Never `double`: it cannot represent 0.1 exactly, so a ledger of rand amounts
drifts as it sums.

## The reminder engine

The brief said the list of reminders keeps growing, which makes it the part of
the design most likely to rot. `ReminderRule` is an interface; each rule is a
class in `reminder/rules/`; Spring injects all of them into `ReminderEngine` as
a `List<ReminderRule>`.

Adding "notify us 60 days before a fixed deposit matures" means writing one
class. No switch statement to extend, no engine to edit, and the new rule is
unit-testable on its own — see `ClientConsentRuleTest`, which runs without
Spring or a database.

Reminders themselves are never stored. They are derived from client data on
every request, so they cannot go stale when a date changes. Only dismissals
persist, because a dismissal is a decision a person made.

## Front end

Plain ES modules. The browser resolves the imports, so there is no build step
and nothing to install.

- `api.js` — every backend call. One place to add an auth header, one place to
  handle a 401, one place that knows the error shape.
- `router.js` — hash routing. The URL is the state, so a refresh lands on the
  same screen and an adviser can bookmark a client file.
- `format.js` — currency, dates, escaping. Display only.
- `ui.js` — shared rendering, loading skeletons, error states, toasts.
- `views/` — one module per screen, lazily imported.
- `css/tokens.css` — the design tokens, matching the `21st-components` skill.
- `css/app.css` — component styles.

`views/clients.js` is complete and is the pattern the others follow: loading
state, fetch, render, error path with a retry. The remaining view modules are
placeholders — the logic exists in the prototype and needs porting, replacing
in-memory data access with `api.*` calls.

## What is not here yet

Deliberately out of scope for a first structure, in the order I would add them:

1. **Authentication and roles.** Spring Security is on the classpath but
   unconfigured. Advisers should see only clients they hold a mandate over, and
   medical underwriting answers need a role check of their own.
2. **Field-level encryption** on `id_number`, via a JPA `AttributeConverter`.
3. **Audit logging** of who read which client file. FAIS record-keeping runs
   five years, and read access to personal information is worth recording.
4. **The service request feature** — change of address, border letters, IRP5
   requests. Same shape as `claim/`.
5. **Provider integrations.** Astute first, since consent already covers it.
