using { db as schema } from '../db/data-model';

service Criticality  {
    entity CriticalityCells as projection on schema.CriticalityCells;
    @odata.draft.enabled @odata.draft.bypass
    entity ActionItems as projection on schema.ActionItems;

}