const express = require('express');
const ServiceRegistry = require('./ServiceRegistry');

const service = express();

module.exports = (config) => {
    const serviceRegistry = new ServiceRegistry();

    // Add a request logging middleware in development mode
    if (service.get('env') === 'development') {
        service.use((req, res, next) => {
            console.debug(`${req.method}: ${req.url}`);
            return next();
        });
    }

    service.put('/:servicename/:serviceversion/:serviceport', (req, res) => {
        const { servicename, serviceversion, serviceport } = req.params;

        const serviceip = req.socket.remoteAddress.includes('::')
            ? `[${req.socket.remoteAddress}]`
            : req.socket.remoteAddress;

        const serviceKey = serviceRegistry.register(servicename, serviceversion, serviceip, serviceport);
        return res.json({ result: serviceKey });
    });

    service.delete('/:servicename/:serviceversion/:serviceport', (req, res) => {
        const { servicename, serviceversion, serviceport } = req.params;

        const serviceip = req.socket.remoteAddress.includes('::')
            ? `[${req.socket.remoteAddress}]`
            : req.socket.remoteAddress;

        const serviceKey = serviceRegistry.unregister(servicename, serviceversion, serviceip, serviceport);
        return res.json({ result: serviceKey });
    });

    service.get('/:servicename/:serviceversion', (req, res) => {
        const { servicename, serviceversion } = req.params;
        const svc = serviceRegistry.get(servicename, serviceversion);
        if (!svc) return res.status(404).json({ result: 'Service not found' });
        return res.json(svc);
    });

    // eslint-disable-next-line no-unused-vars
    service.use((error, req, res, next) => {
        res.status(error.status || 500);
        return res.json({
            message: error.message,
        });
    });
    return service;
};