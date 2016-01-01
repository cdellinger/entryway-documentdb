var assert = require('assert');
var should = require('should');

var UserSchema = require('entryway');
var provider = require('../lib/index');

// Test Data
var testTenant = '#TEST_TENANT#';
var user1 = {userHandle: '|||TESTUSER1|||', twitterHandle: '###TESTUSER1_TWITTER!###'};
var user2 = {userHandle: '|||TESTUSER2|||', twitterHandle: '###TESTUSER2_TWITTER!###'};
var pocketUser = {userHandle: '|||POCKET_TESTUSER1|||', token: 'TEST_TOKEN', token2: 'TEST_TOKEN2'}; 
var tenantUserId = '';		// will be populated later in the tests
var tenantlessUserId = '';  // will be populated later in the tests

var passwordTenantUser = new UserSchema(provider);
var passwordTenantUserId = '';
var passwordTenantUserPassword = '###PASSWORD1###'; 
passwordTenantUser.userHandle = '|||TESTUSER3|||';
passwordTenantUser.tenant = testTenant;


var passwordNonTenantUser = new UserSchema(provider);
var passwordNonTenantUserId = '';
var passwordNonTenantUserPassword = '###PASSWORD1###'; 
passwordNonTenantUser.userHandle = passwordTenantUser.userHandle;


//end of test data



describe('Local Strategy Tests', function() {
	this.timeout(5000);

	before(function(){

	});
	describe('Save Password Tenant User', function () {
		it('should save successfully', function (done) {

			passwordTenantUser.addLocalStrategy(passwordTenantUser.userHandle, passwordTenantUserPassword, function(err, results){
				if (err) throw err;
				passwordTenantUser.save(function(err, results){
					if (err) throw err;
					passwordTenantUserId = passwordTenantUser.id;
					done();
				});
			});
		});
	});

	describe('Failed Password Login for Matching User Without Tenant', function () {
		it('should login successfully', function (done) {
			var testUser = new UserSchema(provider);
			testUser.loginViaPassword(passwordTenantUser.userHandle, passwordTenantUserPassword, '', function(err, results){
				if (err) throw err;
				results.should.equal(false);
				testUser.id.should.equal('');
				testUser.userHandle.should.equal('');
				done();
			});
		});
	});	

	describe('Save Password Non-Tenant User', function () {
		it('should save successfully', function (done) {

			passwordNonTenantUser.addLocalStrategy(passwordNonTenantUser.userHandle, passwordNonTenantUserPassword, function(err, results){
				if (err) throw err;
				passwordNonTenantUser.save(function(err, results){
					if (err) throw err;
					passwordNonTenantUserId = passwordNonTenantUser.id;
					done();
				});
			});
		});
	});


	describe('Add local strategy to user that already has a local strategy', function () {
		it('should fail to add duplicate strategy', function (done) {
			var user = new UserSchema(provider);
			user.loginViaPassword(passwordTenantUser.userHandle, passwordTenantUserPassword, passwordTenantUser.tenant, function(err, results){
				if (err) throw err;
				user.id.should.not.equal('');
				user.addLocalStrategy('TESTUSER', 'PASSWORD', function(err, results){
					err.message.should.equal('A user cannot have two strategies of the same type');
				});
				done();
			});
		});
	});

	describe('Password Login Tenant User', function () {
		it('should login successfully', function (done) {
			var testUser = new UserSchema(provider);
			testUser.loginViaPassword(passwordTenantUser.userHandle, passwordTenantUserPassword, passwordTenantUser.tenant, function(err, results){
				if (err) throw err;
				testUser.userHandle.should.equal(passwordTenantUser.userHandle);
				testUser.id.should.not.equal('');
				results.should.equal(true);
				done();
			});
		});
	});

	describe('Password Login Non-Tenant User', function () {
		it('should login successfully', function (done) {
			var testUser = new UserSchema(provider);
			testUser.loginViaPassword(passwordNonTenantUser.userHandle, passwordNonTenantUserPassword, '', function(err, results){
				if (err) throw err;
				testUser.userHandle.should.equal(passwordNonTenantUser.userHandle);
				testUser.id.should.not.equal('');
				results.should.equal(true);
				done();
			});
		});
	});

	describe('Failed Password Login Tenant User', function () {
		it('should not login', function (done) {
			var testUser = new UserSchema(provider);
			testUser.loginViaPassword(passwordTenantUser.userHandle, passwordTenantUserPassword + 'XXX', passwordTenantUser.tenant, function(err, results){
				if (err) throw err;
				results.should.equal(false);
				testUser.id.should.equal('');
				testUser.userHandle.should.equal('');
				done();
			});
		});
	});
	describe('Failed Login, Valid Password, Invalid Login Tenant User', function () {
		it('should not login', function (done) {
			var testUser = new UserSchema(provider);
			testUser.loginViaPassword(passwordTenantUser.userHandle, passwordTenantUserPassword, 'ASDF', function(err, results){
				if (err) throw err;
				results.should.equal(false);
				testUser.id.should.equal('');
				testUser.userHandle.should.equal('');
				done();
			});
		});
	});
});


describe('Pocket Strategy Tests', function() {
	this.timeout(5000);
	before(function(){

	});
	describe('Create user without tenant with Pocket strategy', function () {
		it('should create user', function (done) {
			var usr = new UserSchema(provider);

			usr.userHandle = pocketUser.userHandle;
			usr.addPocketStrategy(usr.userHandle, pocketUser.token, function(err, results){
				if (err) throw err;
				usr.save(function(err, data){
					if (err) throw err;
					usr.id.should.not.equal('');
					usr.userHandle.should.equal(pocketUser.userHandle);					
					done();
				});
			});
		});
	});

	describe('Login user without tenant with Pocket strategy', function () {
		it('should find user and update token', function (done) {
			var usr = new UserSchema(provider);
			usr.loginViaPocket(pocketUser.userHandle, pocketUser.token2, '', function(err, results){
				if (err) throw err;
				usr.id.should.not.equal('');
				usr.userHandle.should.equal(pocketUser.userHandle);
				var foundPocketStrategy = false;
				for (var x=0;x<usr.strategies.length;x++){
					if (usr.strategies[x].type === 'POCKET'){
						usr.strategies[x].token.should.equal(pocketUser.token2);
						foundPocketStrategy = true;
					}
				}
				foundPocketStrategy.should.equal(true);
				done();
			});
		});
	});

	describe('Remove pocket user without tenant', function () {
		it('should remove matching user', function (done) {
			var usr = new UserSchema(provider);

			usr.loginViaPocket(pocketUser.userHandle, pocketUser.token2, '', function(err, results){
				if (err) throw err;
				usr.id.should.not.equal('');
				usr.userHandle.should.equal(pocketUser.userHandle);

				usr.remove(function(err2, results2){
					if (err2) throw err2;
					usr.loginViaPocket(pocketUser.userHandle, pocketUser.token2, '', function(err3, results3){
						if (err3) throw err3;
						usr.id.should.equal('');
						done();
					});
				});
			});
		});
	});
});


describe('Cross Strategy Tests', function() {
	this.timeout(5000);
	before(function(){

	});

	describe('Create user with multiple strategies', function(){
		it('should not allow the creation of the second strategy', function(done){
			var user = new UserSchema(provider);
			user.addPocketStrategy('TESTUSER', 'TESTHANDLE', function(err, results){
				if (err) throw err;
				user.addLocalStrategy('TESTUSER', 'PASSWORD', function(err2, results2){
					err2.message.should.equal('An unpersisted user cannot have more than one strategy');
					done();
				});			
			});
		});
	});

	describe('Save With Tenant', function () {
		it('should persist without error', function (done) {
			var tenantUser = new UserSchema(provider);
			tenantUser.userHandle = user1.userHandle;
			tenantUser.tenant = testTenant;
			tenantUser.location = 'Edinburg, VA';
			tenantUser.addTwitterStrategy(user1.twitterHandle, 'TWITTER_TOKEN', function(err, results){
				if (err) throw err;
				tenantUser.save(function(err, results){
					if (err) throw err;
					tenantUserId = tenantUser.id;
					done();
				});
			});
		});
	});


	describe('Save Without Tenant', function () {
		it('should persist without error', function (done) {
			var tenantlessUser = new UserSchema(provider);
			tenantlessUser.userHandle = user2.userHandle;
			tenantlessUser.addTwitterStrategy(user2.twitterHandle, 'TWITTER_TOKEN', function(err, results){
				if (err) throw err;
				tenantlessUser.save(function(err, results){
					if (err) throw err;
					tenantlessUserId = tenantlessUser.id;
					done();
				});
			});
		});
	});

	describe('Get By Strategy With Tenant', function () {
		it('should retrieve matching user', function (done) {
			var testUser = new UserSchema(provider);
			testUser.getByStrategy('TWITTER', user1.twitterHandle, testTenant, function(err, user){
				if (err) throw err;
				testUser.userHandle.should.equal(user1.userHandle);
				var foundStrategy = false;
				for (var x=0;x<testUser.strategies.length;x++){
					if (testUser.strategies[x].type === 'TWITTER'){
						foundStrategy = true;
					}
				}
				foundStrategy.should.equal(true);
				done();
			});
		});
	});

	describe('Get By Strategy Without Tenant', function () {
		it('should retrieve matching user', function (done) {
			var testUser = new UserSchema(provider);	
			testUser.getByStrategy('TWITTER', user2.twitterHandle, '', function(err, result){
				if (err) throw err;
				testUser.userHandle.should.equal(user2.userHandle);
				var foundStrategy = false;
				for (var x=0;x<testUser.strategies.length;x++){
					if (testUser.strategies[x].type === 'TWITTER'){
						foundStrategy = true;
					}
				}
				foundStrategy.should.equal(true);

				done();
			});
		});
	});

	describe('Get By Strategy With Tenant with Invalid Strategy Id', function () {
		it('should retrieve matching user', function (done) {
			var testUser = new UserSchema(provider);			
			testUser.getByStrategy('TWITTER', 'INVALID_USER_STRATEGY_ID', testTenant, function(err, user){
				if (err) throw err;
				testUser.id.should.equal('');
				done();
			});
		});
	});

	describe('Get By Strategy Without Tenant with Invalid Strategy Id', function () {
		it('should retrieve matching user', function (done) {
			var testUser = new UserSchema(provider);			
			testUser.getByStrategy('TWITTER', 'INVALID_USER_STRATEGY_ID', '', function(err, user){
				if (err) throw err;
				testUser.id.should.equal('');
				done();
			});
		});
	});

	describe('Get By Strategy With Invalid Tenant', function () {
		it('should retrieve undefined value', function (done) {
			var testUser = new UserSchema(provider);			
			testUser.getByStrategy('TWITTER', user1.twitterHandle, 'INVALID_TENANT', function(err, user){
				if (err) throw err;
				testUser.id.should.equal('');
				done();	
			});
		});
	});


	describe('Update User with Tenant', function () {
		it('should update successfully', function (done) {
			var testUser = new UserSchema(provider);
			testUser.getById(tenantUserId, function(err, results){
				if (err) throw err;
				testUser.id.should.not.equal('');
				testUser.id.should.equal(tenantUserId);

				var newEmail = testUser.email + '1234';
				testUser.email = newEmail;

				testUser.save(function(err2, results2){
					if (err2) throw err2;
					var testUser2 = new UserSchema(provider);
					testUser2.getById(tenantUserId, function(err3, results3){
						if (err3) throw err3;
						testUser2.email.should.equal(newEmail);
						done();
					});
				});
			});
		});
	});


	describe('Update User with Tenant on optional fields', function () {
		it('should update successfully', function (done) {
			var testUser = new UserSchema(provider);
			testUser.getById(tenantUserId, function(err, results){
				if (err) throw err;
				testUser.id.should.not.equal('');
				testUser.id.should.equal(tenantUserId);

				testUser.location = 'Boulder, CO';
				testUser.fullName = 'John Smith';
				testUser.bio = 'It was the best of times...';
				testUser.avatar = 'http://www.avatar.com/me';
				testUser.save(function(err2, results2){
					if (err2) throw err2;
					var testUser2 = new UserSchema(provider);
					testUser2.getById(tenantUserId, function(err3, results3){
						if (err3) throw err3;
						testUser2.location.should.equal('Boulder, CO');
						testUser2.fullName.should.equal('John Smith');
						testUser2.bio.should.equal('It was the best of times...');
						testUser2.avatar.should.equal('http://www.avatar.com/me');
						done();
					});
				});
			});
		});
	});

	describe('Update User with Tenant by nulling optional fields', function () {
		it('should update successfully', function (done) {
			var testUser = new UserSchema(provider);
			testUser.getById(tenantUserId, function(err, results){
				if (err) throw err;
				testUser.id.should.not.equal('');
				testUser.id.should.equal(tenantUserId);

				testUser.location = '';
				testUser.fullName = '';
				testUser.bio = '';
				testUser.avatar = '';
				testUser.save(function(err2, results2){
					if (err2) throw err2;
					var testUser2 = new UserSchema(provider);
					testUser2.getById(tenantUserId, function(err3, results3){
						if (err3) throw err3;
						testUser2.location.should.equal('');
						testUser2.fullName.should.equal('');
						testUser2.bio.should.equal('');
						testUser2.avatar.should.equal('');
						done();
					});
				});
			});
		});
	});


	describe('Update User without Tenant', function () {
		it('should update successfully', function (done) {
			var testUser = new UserSchema(provider);			
			testUser.getById(tenantlessUserId, function(err, results){
				if (err) throw err;
				var newEmail = testUser.email + '1234';
				testUser.email = newEmail;
				testUser.save(function(err2, data){
					if (err2) throw err2;
					var testUser2 = new UserSchema(provider);
					testUser2.getById(tenantlessUserId, function(err3, results){
						if (err3) throw err3;
						testUser2.email.should.equal(newEmail);
						done();
					});
				});
			});
		});
	});

	describe('Create duplicate user with tenant', function () {
		it('should fail to create duplicate user', function (done) {
			var tenantUser = new UserSchema(provider);
			tenantUser.userHandle = user1.userHandle;
			tenantUser.tenant = testTenant;
			tenantUser.addTwitterStrategy(user1.twitterHandle + 'abcd', 'TWITTER_TOKEN', function(err, results){
				if (err) throw err;
				tenantUser.save(function(errSave, data){
					errSave.message.should.equal('User exists already with this user handle');
					done();
				});
			});
		});
	});

	describe('Create duplicate user without tenant', function () {
		it('should fail to create duplicate user', function (done) {
			var tenantlessUser = new UserSchema(provider);
			//var tenantlessUserId = user2.userHandle;

			tenantlessUser.userHandle = user2.userHandle;
			tenantlessUser.addTwitterStrategy(user2.twitterHandle + 'abcd', 'TWITTER_TOKEN', function(err, results){
				if (err) throw err;
				tenantlessUser.save(function(errSave, data){
					errSave.message.should.equal('User exists already with this user handle');
					done();
				});
			});
		});
	});


	describe('Create user with tenant with duplicated strategy', function () {
		it('should fail to create user', function (done) {
			var usr = new UserSchema(provider);
			usr.userHandle = '|||TESTUSER3|||';
			usr.tenant = testTenant;
			usr.addTwitterStrategy(user1.twitterHandle, 'TWITTER_TOKEN', function(err, results){
				err.message.should.equal('This strategy is already in use');
				done();
			});
		});
	});

	describe('Create user without tenant with duplicated strategy', function () {
		it('should fail to create user', function (done) {
			var usr = new UserSchema(provider);
			usr.userHandle = '|||TESTUSER3|||';
			usr.addTwitterStrategy(user2.twitterHandle, 'TWITTER_TOKEN', function(err, results){
				err.message.should.equal('This strategy is already in use');
				done();
			});
		});
	});
});



describe('Cleanup Tests', function() {
	this.timeout(5000);
	before(function(){

	});


	describe('Remove user with tenant', function () {
		it('should remove matching user', function (done) {
			var testUser = new UserSchema(provider);
			testUser.getById(tenantUserId, function(err, results){
				if (err) throw err;
				testUser.remove(function(err2, data){
					if (err2) throw err2;
					testUser.getById(tenantUserId, function(err, results){
						if (err) throw err;
						testUser.id.should.equal('');
						done();
					});
				});
			});
		});
	});

	describe('Remove user without tenant', function () {
		it('should remove matching user', function (done) {
			var testUser = new UserSchema(provider);
			testUser.getById(tenantlessUserId, function(err, results){
				if (err) throw err;
				testUser.remove(function(err2, data){
					if (err2) throw err2;
					testUser.getById(tenantlessUserId, function(err, results){
						if (err) throw err;
						testUser.id.should.equal('');
						done();
					});
				});
			});
		});
	});

	describe('Remove password tenant user', function () {
		it('should remove matching user', function (done) {
			var testUser = new UserSchema(provider);			
			testUser.getById(passwordTenantUserId, function(err, results){
				if (err) throw err;
				testUser.remove(function(err2, data){
					if (err2) throw err2;
					testUser.getById(passwordTenantUserId, function(err, results){
						if (err) throw err;
						testUser.id.should.equal('');
						done();
					});
				});
			});
		});
	});
	
	describe('Remove password non-tenant user', function () {
		it('should remove matching user', function (done) {
			var testUser = new UserSchema(provider);			
			testUser.getById(passwordNonTenantUserId, function(err, results){
				if (err) throw err;
				testUser.remove(function(err2, data){
					if (err2) throw err2;
					testUser.getById(passwordNonTenantUserId, function(err, results){
						if (err) throw err;
						testUser.id.should.equal('');
						done();
					});
				});
			});
		});
	});


	after(function(){
	});

});





