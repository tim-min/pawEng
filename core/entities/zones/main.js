let ZONE_TYPES = {
   _count: 1,
   CLICK: 0
}

export function registerZoneType(name) {
    if (ZONE_TYPES[name] !== undefined) throw new Error(`Zone type with name '${name}' already exists`);

    ZONE_TYPES[name] = ZONE_TYPES._count;
    ZONE_TYPES._count += 1;
}

export function getZoneTypes() {
    const ztCopy = { ...ZONE_TYPES };
    delete ztCopy._count;
    return ztCopy;
}