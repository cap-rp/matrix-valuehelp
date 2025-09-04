using { db as schema } from '../db/data-model';

service Criticality  {
    
    @odata.draft.enabled
    entity ActionItems as projection on schema.ActionItems;
    entity CriticalityCells as projection on schema.CriticalityCells;

}