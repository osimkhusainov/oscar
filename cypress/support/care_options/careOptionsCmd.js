Cypress.Commands.add("getRandomOption", () => {
  cy.findAllByRole("option")
    .should("have.length.greaterThan", 0)
    .its("length")
    .then((elements) => Cypress._.random(elements - 1))
    .then((randomEl) => cy.findAllByRole("option").eq(randomEl).click());
});

Cypress.Commands.add("openOptions", (textSelector) => {
  cy.findByText(textSelector)
    .next()
    .should("contain.text", "Select an option")
    .click();
});
