describe("Find a Doctor by Provider", () => {
  const search = {
    provider: "Primary Care Provider",
  };
  before(() => {
    cy.intercept("search/api/v2/networks").as("networks");
    cy.intercept("search/api/v2/network-details?**").as("network-details");
    cy.intercept("member/search/results/doctors/api?**").as("doctors-results");
    cy.visit("/");
  });
  it("Choose individual coverage than check network details and doctors results from UI and API response", () => {
    cy.findByRole("link", { name: "Find a Doctor" })
      .should("be.visible")
      .click();
    cy.findByRole("button", { name: "Search network" }).click();
    cy.wait("@networks").then(({ response }) => {
      const networkYears = Object.keys(response.body.networkDetailsByYear);
      cy.findByRole("dialog").should("contain.text", "Select a network");
      cy.findByRole("button", { name: "Continue" }).should("be.disabled");
      cy.openOptions("Coverage year");
      cy.findAllByRole("option")
        .should("have.length", networkYears.length)
        .each((option) => {
          cy.wrap(option)
            .invoke("text")
            .then((year) => expect(networkYears).includes(year));
        });
      cy.getRandomOption();
      cy.openOptions("Coverage access");
      cy.findAllByRole("option")
        .should("have.length.greaterThan", 0)
        .contains("Individual")
        .click();
      cy.findByText("Coverage access")
        .next()
        .should("contain.text", "Individual");
      cy.findByText("Network partner").next().should("contain.text", "Oscar");
      cy.openOptions("Coverage area");
      cy.getRandomOption();
      cy.get("body").then(($body) => {
        if ($body.find("h3:contains(Network type)").length > 0) {
          cy.openOptions("Network type");
          cy.getRandomOption();
        }
      });
      cy.findByRole("button", { name: "Continue" })
        .should("be.enabled")
        .click();
      cy.wait("@network-details").then(({ response }) => {
        const state = Object.keys(response.body.coverageAreas)[0];
        const { zipCode } = response.body.coverageAreas[state].searchAnchor;
        const { name } = response.body;
        const year = Object.keys(response.body.tierLabelsByYear)[0];
        cy.wrap(year).as("year");
        cy.contains("Search in-network providers, facilities, and drugs");
        cy.get(".o-primaryText")
          .should("contain.text", state)
          .and("contain.text", name)
          .and("contain.text", year);
        cy.findByPlaceholderText("Zip code").should("have.value", zipCode);
        cy.get("#typeahead-input")
          .should("not.have.value")
          .type("+", { force: true });
        cy.get(".o-resultsContainer")
          .should("not.contain.text", "Something went wrong. Please try again.")
          .and("contain.text", "No results. Try another search.");
        cy.get("#typeahead-input").clear();
        cy.get(".o-resultsContainer")
          .should("contain.text", "Common searches")
          .contains(search.provider)
          .click();
        cy.wait("@doctors-results").then(function ({ response }) {
          const { name: providerName } = response.body.requestInfo?.specialty;
          const { totalResultCount } = response.body;
          cy.log(response);
          cy.url().should("include", this.year);
          cy.findByRole("button", { name: "Within 50 miles" })
            .children()
            .should("have.class", "o-trigger_highlighted");
          cy.get(".o-sortContainer").should("contain.text", "Sort by Distance");
          cy.get(".o-breadcrumbWrapper")
            .contains(providerName)
            .invoke("text")
            .then((text) => {
              // if we receive 1,123 it is going to remove a comma. 1,123 => 1123. Because on UI we don't have the comma
              const resultWithoutComma = text.replace(/,/g, "");
              expect(resultWithoutComma).contains(totalResultCount);
            });
          // Check sort by Distance where last index of distance should be greater than first index
          cy.get(".o-results a.o-container")
            .should("have.length", response.body.results.length)
            .children("div.o-text")
            .then(($miles) => {
              const miles = Array.from($miles, (el) =>
                parseFloat(el.innerText)
              );
              expect(miles[0]).to.be.lte(miles[miles.length - 1]);
            });
        });
      });
    });
  });
});
