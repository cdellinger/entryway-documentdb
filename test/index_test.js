describe("Standard Entryway DynamoDB Provider Tests", function () {
	// Execute the standard provider test that is contained within Entryway, all providers should be able to support these tests
    require('entryway').ProviderTest(require('../lib/index'));
});