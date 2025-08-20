sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'qe/manageactions/test/integration/FirstJourney',
		'qe/manageactions/test/integration/pages/ActionItemsList',
		'qe/manageactions/test/integration/pages/ActionItemsObjectPage',
		'qe/manageactions/test/integration/pages/ActionItems_textsObjectPage'
    ],
    function(JourneyRunner, opaJourney, ActionItemsList, ActionItemsObjectPage, ActionItems_textsObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('qe/manageactions') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheActionItemsList: ActionItemsList,
					onTheActionItemsObjectPage: ActionItemsObjectPage,
					onTheActionItems_textsObjectPage: ActionItems_textsObjectPage
                }
            },
            opaJourney.run
        );
    }
);