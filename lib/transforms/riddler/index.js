const querystring = require('querystring')
const { Scheduler } = require('@pown/request/lib/scheduler')

const { Transformer } = require('../../transformer')

const scheduler = new Scheduler()

const riddlerIpSearch = class extends Transformer {
    static get alias() {
        return ['riddler_ip_search', 'ris']
    }

    static get title() {
        return 'Riddler IP Search'
    }

    static get description() {
        return 'Searches for IP references using F-Secure riddler.io.'
    }

    static get types() {
        return ['*']
    }

    static get options() {
        return {}
    }

    constructor() {
        super()
    }

    async run(items, options) {
        const results = await Promise.all(items.map(async({ id: target = '', label = '' }) => {
            const query = querystring.stringify({
                q: `ip:${label}`
            })

            const { responseBody } = await scheduler.fetch(`https://riddler.io/search/exportcsv?${query}`, this.headers)

            const lines = responseBody.toString().trim().split('\n').slice(2).filter(l => l).map(l => l.split(','))

            const ips = lines.map(([ip, _data, _c1, _c2, _country, _fqdn, _keywords, _pld, domain]) => {
                return [
                    { id: ip, type: 'ipv4', label: ip, props: { ipv4: ip, domain }, edges: [target] },
                    { id: domain, type: 'domain', label: domain, props: { ipv4: ip, domain }, edges: [ip] }
                ]
            })

            return [].concat(ips)
        }))

        return this.flatten(results, 3)
    }
}

const riddlerDomainSearch = class extends Transformer {
    static get alias() {
        return ['riddler_domain_search', 'rds']
    }

    static get title() {
        return 'Riddler Domain Search'
    }

    static get description() {
        return 'Searches for Domain references using F-Secure riddler.io.'
    }

    static get types() {
        return ['*']
    }

    static get options() {
        return {}
    }

    constructor() {
        super()
    }

    async run(items, options) {
        const results = await Promise.all(items.map(async({ id: target = '', label = '' }) => {
            const query = querystring.stringify({
                q: `pld:${label}`
            })

            const { responseBody } = await scheduler.fetch(`https://riddler.io/search/exportcsv?${query}`, this.headers)

            const lines = responseBody.toString().trim().split('\n').slice(2).filter(l => l).map(l => l.split(','))

            const ips = lines.map(([ip, _data, _c1, _c2, _country, fqdn, _keywords, _pld, domain]) => {
                return [
                    { id: fqdn, type: 'domain', label: fqdn, props: { ipv4: ip, domain: fqdn }, edges: [target] },
                    { id: ip, type: 'ipv4', label: ip, props: { ipv4: ip, domain: fqdn }, edges: [fqdn] }
                ]
            })

            return [].concat(ips)
        }))

        return this.flatten(results, 3)
    }
}

module.exports = { riddlerIpSearch, riddlerDomainSearch }
