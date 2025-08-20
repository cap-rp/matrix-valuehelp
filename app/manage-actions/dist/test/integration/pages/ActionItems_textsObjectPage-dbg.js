sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'qe.manageactions',
            componentId: 'ActionItems_textsObjectPage',
            contextPath: '/ActionItems/texts'
        },
        CustomPageDefinitions
    );
});