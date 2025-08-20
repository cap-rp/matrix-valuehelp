using Criticality as service from '../../srv/service';

annotate service.ActionItems with @UI.LineItem: [
    {
        $Type            : 'UI.DataField',
        Value            : ID,
        ![@UI.Importance]: #High,
    },


    {
        $Type            : 'UI.DataField',
        Value            : title,
        ![@UI.Importance]: #High,
    },
    {
        $Type            : 'UI.DataField',
        Value            : descr,
        ![@UI.Importance]: #High,
    },
     {
        $Type            : 'UI.DataField',
        Value            : criticality,
        ![@UI.Importance]: #High,
    },


]
