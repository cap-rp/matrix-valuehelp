sap.ui.define(['sap/fe/test/ListReport'], function(ListReport) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ListReport(
        {
            appId: 'qe.manageactions',
            componentId: 'ActionItemsList',
            contextPath: '/ActionItems'
        },
        CustomPageDefinitions
    );
});