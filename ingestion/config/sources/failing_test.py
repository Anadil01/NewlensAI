def failing_scraper():

    raise Exception(
        "Simulated source failure"
    )


failing_source = {

    "slug": "failing-test",

    "name": "Failing Test Source",

    "type": "TEST",

    "enabled": True,

    "scraper": failing_scraper
}