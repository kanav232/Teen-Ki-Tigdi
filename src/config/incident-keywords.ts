
// List of keywords to poll from Bluesky for crowdsourced incident detection
// Add more keywords here as needed

export const KEYWORD_MATCH_THRESHOLD = 2; // Post must match at least this many keywords to be processed

export const EXCLUDED_KEYWORDS = [
    'game', 'movie', 'song', 'lyrics', 'deal', 'sale', 'metaphor', 'like fire', 'on fire'
];

export const REQUIRED_KEYWORDS = ['Ashoka'];

export const INCIDENT_KEYWORDS = [
    // --- ROAD & INFRASTRUCTURE DAMAGE ---
    'pothole', 'potholes', 'road broken', 'broken road', 'damaged road', 'road damage',
    'road collapse', 'road caved in', 'road sunk', 'uneven road', 'bad road', 'road hazard',
    'huge pit', 'big hole on road', 'crater on road', 'road washed out', 'road condition bad',
    'road not repaired', 'road under construction dangerous', 'road repair pending',
    'deep pothole', 'dangerous pothole', 'road cracking', 'road surface broken', 'road sinking',
    'road unsafe', 'road issue', 'road problem',
    'flyover broken', 'flyover damage', 'flyover unsafe', 'bridge broken', 'bridge crack',
    'bridge damaged', 'bridge unsafe', 'bridge collapse',
    'broken railing', 'railing missing', 'railing broken', 'flyover railing broken',
    'bridge railing missing', 'guardrail broken', 'guardrail missing',
    'flyover crack', 'structural damage', 'infrastructure crack', 'weak structure',
    'unsafe bridge', 'old bridge dangerous', 'flyover shaking',
    'bridge risk', 'bridge problem',
    'footpath broken', 'footpath damaged', 'footpath unsafe', 'broken pavement',
    'open manhole', 'manhole uncovered', 'manhole open', 'sewer open', 'drain open', 'drainage open',
    'sidewalk broken', 'sidewalk unsafe', 'collapsed footpath', 'public infra damaged',
    'street damaged', 'roadside collapse', 'construction debris on road',
    'illegal construction dangerous', 'exposed wiring', 'electric pole damaged', 'fallen pole',
    'street light fallen', 'street light broken', 'public safety hazard',

    // --- GENERAL DANGER & SAFETY ---
    'dangerous', 'unsafe', 'risk', 'high risk', 'life threatening', 'fatal', 'deadly',
    'serious danger', 'major hazard', 'public danger', 'safety issue', 'safety risk',
    'emergency', 'urgent', 'immediate action needed', 'critical condition', 'very risky',
    'extremely dangerous', 'please fix', 'complaint',
    'reported earlier', 'still not fixed', 'no action taken', 'authorities please',
    'govt please notice', 'concerned authorities', 'urgent attention needed',
    'ignored issue', 'same problem again', 'wake up authorities', 'who is responsible',
    'public safety risk', 'threat to life', 'hazardous',

    // --- ACCIDENTS ---
    'accident', 'accident prone', 'caused accident', 'injured', 'people injured', 'death',
    'people died', 'casualties', 'death reported',
    'traffic accident', 'traffic hazard', 'blind turn', 'sharp turn dangerous', 'poor visibility',
    'vehicle skidded', 'car damaged', 'bike accident', 'pedestrian accident', 'multiple accidents here',

    // --- TRAFFIC & SIGNS ---
    'no warning sign', 'missing signboard', 'traffic congestion due to damage', 'road blocked',
    'lane closed', 'unsafe diversion', 'temporary road dangerous', 'barricade missing',
    'traffic mismanagement', 'road sign missing', 'reflector missing', 'speed breaker damaged',
    'speed breaker missing', 'unmarked speed breaker', 'dangerous curve', 'traffic chaos',
    'stuck in traffic', 'traffic jam', 'gridlock',

    // --- WATERLOGGING & FLOODING ---
    'waterlogged road', 'waterlogging', 'flooded street', 'flooded road', 'rainwater accumulation',
    'road flooded', 'drain overflow', 'sewer overflow', 'water on road', 'slippery road',
    'muddy road', 'road erosion after rain', 'infrastructure weakened by rain',
    'storm damage', 'rain damage', 'monsoon damage', 'collapsed due to rain', 'unsafe during rain',
    'flood risk', 'rain hazard', 'urban flooding', 'flash flood',

    // --- LOCATIONS & ZONES ---
    'public space unsafe', 'market area dangerous', 'school road unsafe', 'hospital road unsafe',
    'residential area risk', 'crowded area danger', 'pedestrian zone unsafe', 'children at risk',
    'elderly at risk', 'daily commuters affected', 'public inconvenience', 'unsafe public area',
    'high footfall area', 'urban safety issue', 'city safety concern',

    // --- CONSTRUCTION ISSUES ---
    'poor construction', 'substandard construction', 'illegal construction', 'unsafe construction',
    'construction negligence', 'construction debris', 'debris on road', 'open construction site',
    'construction hazard', 'maintenance issue', 'lack of maintenance', 'maintenance delayed',
    'repair work incomplete', 'temporary repair failed', 'work abandoned', 'repair pending',
    'maintenance failure', 'construction quality poor', 'unsafe repair', 'infrastructure negligence',

    // --- FIRE ---
    'fire', 'fire accident', 'fire outbreak', 'fire hazard', 'fire emergency', 'building fire',
    'slum fire', 'market fire', 'factory fire', 'warehouse fire', 'residential fire', 'electrical fire',
    'short circuit', 'gas cylinder blast', 'LPG leak', 'kitchen fire', 'chemical fire',
    'smoke', 'thick smoke', 'toxic smoke', 'fire alarm', 'fire extinguisher', 'fire exit blocked',
    'emergency exit', 'fire safety', 'fire drill', 'fire code violation', 'no fire clearance',
    'fire department', 'fire brigade', 'fire tender', 'delayed response',
    'trapped residents', 'evacuation', 'burn injuries', 'property damage', 'fire risk', 'inflammable material',

    // --- INCLUSIVITY & ACCESSIBILITY ---
    'inclusivity', 'inclusion', 'accessibility', 'accessible', 'barrier-free', 'disabled access',
    'disability', 'differently abled', 'wheelchair access', 'ramp missing', 'broken ramp',
    'no lift', 'lift not working', 'tactile paving', 'braille signage',
    'hearing impaired', 'visually impaired', 'mobility issues', 'elderly friendly', 'senior citizens',
    'child friendly', 'women friendly', 'gender inclusive', 'LGBTQ friendly', 'safe space',
    'public access', 'inclusive design', 'universal design',
    'sidewalk obstruction', 'encroachment', 'uneven footpath', 'inaccessible toilet', 'public toilet access',
    'migrant inclusion', 'homeless support', 'urban poor', 'social inclusion',
    'marginalized community', 'slum dwellers',

    // --- NATURAL DISASTERS ---
    'natural disaster', 'disaster alert', 'emergency warning', 'flood', 'cyclone', 'storm',
    'heavy rainfall', 'cloudburst', 'landslide', 'mudslide', 'earthquake', 'tremor', 'seismic activity',
    'building collapse', 'structural damage', 'rescue operation', 'relief camp', 'evacuation center',
    'displaced families', 'disaster response', 'emergency shelter', 'food shortage', 'water shortage',
    'power outage', 'communication failure', 'bridge collapse', 'fallen trees', 'heatwave',
    'extreme heat', 'heatstroke', 'cold wave', 'extreme weather', 'climate disaster', 'disaster management'
];
