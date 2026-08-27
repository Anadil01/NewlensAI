def failing_scraper():

    raise Exception(
        "Simulated source failure"
    )


failing_source = {

    "slug": "failing-test",

    "name": "Failing Test Source",

    "type": "TEST",

    # Disabled: this source always raises on purpose. It is a test
    # fixture and must not run in the real source registry.
    "enabled": False,

    "scraper": failing_scraper
}