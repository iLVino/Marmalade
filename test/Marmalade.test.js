const { assert, use, should } = require("chai")

const Marmalade = artifacts.require('./Marmalade.sol')

require('chai')
    use(require('chai-as-promised'))
    should()

contract('Marmalade', ([deployer, seller, buyer]) => {
    let marmalade

    before(async () => {
        marmalade = await Marmalade.deployed()
    })

    describe('deployment', async () => {
        it('deploys successfully', async () => {
            const address = await marmalade.address
            assert.notEqual(address, 0x0)
            assert.notEqual(address, '')
            assert.notEqual(address, null)
            assert.notEqual(address, undefined)
        })

        it('has a name', async () => {
            const name = await marmalade.name()
            assert.equal(name, 'Marmalade')
        })
    })

    describe('products', async () => {
        let result, productCount
        before(async () => {
            result = await marmalade.createProduct( 'gen1_Jair_M1', web3.utils.toWei('1', 'Ether'), { from: seller})
            productCount = await marmalade.productCount()
        })

        it('creates products', async () => {
        // SUCCESS  
        assert.equal(productCount, 1)
        const event = result.logs[0].args 
        assert.equal(event.id.toNumber(), productCount.toNumber(), 'id is correct')
        assert.equal(event.name, 'gen1_Jair_M1', 'is correct')
        assert.equal(event.price, '1000000000000000000', 'is correct')
        assert.equal(event.owner, seller, 'owner is correct')
        assert.equal(event.purchased, false, 'purchase ‚is correct')

        // FAILURE: Product must have a name
        await await marmalade.createProduct( '', web3.utils.toWei('1', 'Ether'), { from: seller}).should.be.rejected;
        // FAILRUE: Product must have a price
        await await marmalade.createProduct( 'gen1_Jair_M1', 0, { from: seller}).should.be.rejected;
        })

        it('lists products', async () => {
            const product = await marmalade.products(productCount)
            assert.equal(product.id.toNumber(), productCount.toNumber(), 'id is correct')
            assert.equal(product.name, 'gen1_Jair_M1', 'is correct')
            assert.equal(product.price, '1000000000000000000', 'is correct')
            assert.equal(product.owner, seller, 'owner is correct')
            assert.equal(product.purchased, false, 'purchase ‚is correct')
        })

        it('sells products', async () => {
            // Track the seller balance before purchase
            let oldSellerBalance
            oldSellerBalance = await web3.eth.getBalance(seller)
            oldSellerBalance = new web3.utils.BN(oldSellerBalance)

            // SUCCESS: Buyer makes purchase
            result = await marmalade.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei('1', 'Ether')})
            
            // Check logs
            const event = result.logs[0].args 
            assert.equal(event.id.toNumber(), productCount.toNumber(), 'id is correct')
            assert.equal(event.name, 'gen1_Jair_M1', 'is correct')
            assert.equal(event.price, '1000000000000000000', 'is correct')
            assert.equal(event.owner, buyer, 'owner is correct')
            assert.equal(event.purchased, true, 'purchase ‚is correct')

            // Check that seller recived funds
            let newSellerBalance
            newSellerBalance = await web3.eth.getBalance(seller)
            newSellerBalance = new web3.utils.BN(newSellerBalance)

            let price
            price = web3.utils.toWei('1', 'Ether')
            price = new web3.utils.BN(price)

            const expectedBalance = oldSellerBalance.add(price)

            assert.equal(newSellerBalance.toString(), expectedBalance.toString())

            // FAILURE: Tries to buy a product that does not exist, i.e., product must have valid id
            await marmalade.purchaseProduct(99, { from: buyer, value: web3.utils.toWei('1', 'Ether')}).should.be.rejected;
            // FAILURE: Buyer tries to buy without enough ether 
            await marmalade.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei('0.5', 'Ether')}).should.be.rejected;
            // FAILURE: Deployer tries to buy the product, i.e., product can't be purchased twice
            await marmalade.purchaseProduct(productCount, { from: deployer, value: web3.utils.toWei('1', 'Ether')}).should.be.rejected;
            // FAILURE: Buyer tries to buy again, i.e., buyer can't be the seller
            await marmalade.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei('1', 'Ether')}).should.be.rejected;
            
        })
    })
})