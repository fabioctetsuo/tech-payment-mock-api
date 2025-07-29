Feature: Payment Processing
  As a payment service
  I want to process payment requests
  So that I can handle transactions for orders

  Scenario: Successfully process a payment request
    Given a payment request with valid data
    When the payment is processed
    Then the payment status should be "processing"
    And a success response should be returned
    And the payment should be sent to the webhook

  Scenario: Process payment with minimal required data
    Given a payment request with only pedido_id
    When the payment is processed
    Then the payment status should be "processing"
    And the payment should be sent to the webhook with approved status

  Scenario: Health check endpoint returns system status
    Given the payment service is running
    When a health check is requested
    Then the health status should be "ok"
    And a timestamp should be included in the response

  Scenario: Payment webhook receives correct data
    Given a payment request with complete data
    When the payment is processed
    Then the webhook should receive the payment data
    And the webhook payload should contain approved status
    And the webhook should be called with correct URL