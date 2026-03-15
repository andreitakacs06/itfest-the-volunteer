import React, { useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Text, TextInput, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAuth } from '../hooks/useAuth';
import { createTask } from '../services/taskService';
import { ALL_CATEGORIES, CATEGORY_META, PALETTE, RADIUS, REQUESTER_COLORS, SHADOW_MD, SHADOW_SM, TaskCategory } from '../utils/theme';

// ─── Inline field error hook ───────────────────────────────────────────────────
const useField = (initial = '') => {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const validate = (rule: (v: string) => string | null) => {
    const msg = rule(value);
    setError(msg);
    return msg === null;
  };
  const clear = () => { setValue(initial); setError(null); };
  return { value, setValue, error, setError, validate, clear };
};

// ─── Sub-components ────────────────────────────────────────────────────────────
const SectionHeader = ({ label, required }: { label: string; required?: boolean }) => (
  <View style={ss.sectionHeader}>
    <Text style={ss.sectionTitle}>{label}</Text>
    {required && <Text style={ss.required}>required</Text>}
  </View>
);

const FieldError = ({ msg }: { msg: string | null }) =>
  msg ? <Text style={ss.errorText}>⚠ {msg}</Text> : null;

const StyledInput = ({
  label,
  field,
  multiline,
  lines,
  keyboardType,
  placeholder,
}: {
  label: string;
  field: ReturnType<typeof useField>;
  multiline?: boolean;
  lines?: number;
  keyboardType?: 'default' | 'decimal-pad' | 'phone-pad';
  placeholder?: string;
}) => (
  <View style={ss.fieldWrap}>
    <TextInput
      mode="outlined"
      label={label}
      value={field.value}
      onChangeText={(t) => { field.setValue(t); field.setError(null); }}
      multiline={multiline}
      numberOfLines={lines}
      keyboardType={keyboardType ?? 'default'}
      placeholder={placeholder}
      outlineStyle={[ss.inputOutline, field.error ? ss.inputOutlineError : null]}
      style={ss.input}
    />
    <FieldError msg={field.error} />
  </View>
);

// ─── Main screen ───────────────────────────────────────────────────────────────
export const CreateTaskScreen = () => {
  const { firebaseUser, profile } = useAuth();
  const requesterType = profile?.requesterType;

  const title       = useField();
  const description = useField();
  const hours       = useField();

  // Juridic
  const orgName     = useField();
  const repName     = useField();
  const orgAddress  = useField();
  // Physical
  const phone       = useField();
  const prefTime    = useField();
  const access      = useField();

  const [category, setCategory]     = useState<TaskCategory | null>(null);
  const [categoryError, setCategoryError] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [mapRegion, setMapRegion]   = useState({
    latitude: 44.4268,
    longitude: 26.1025,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState(false);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateAndSubmit = async () => {
    if (!firebaseUser) return;

    if (!requesterType) {
      Alert.alert('Complete profile first', 'Set your profile type in the Profile screen before creating a task.');
      return;
    }

    let valid = true;

    if (!category) { setCategoryError(true); valid = false; }
    else            { setCategoryError(false); }

    if (!title.validate((v) => v.trim() ? null : 'Title is required'))                       valid = false;
    if (!description.validate((v) => v.trim() ? null : 'Description is required'))           valid = false;
    if (!hours.validate((v) => {
      const n = Number(v);
      if (!v.trim()) return 'Estimated hours is required';
      if (!Number.isFinite(n) || n <= 0 || n > 24) return 'Must be between 0.5 and 24';
      return null;
    })) valid = false;

    if (requesterType === 'juridic') {
      if (!orgName.validate((v)    => v.trim() ? null : 'Organization name is required'))   valid = false;
      if (!repName.validate((v)    => v.trim() ? null : 'Representative name is required')) valid = false;
      if (!orgAddress.validate((v) => v.trim() ? null : 'Address is required'))              valid = false;
    }

    if (requesterType === 'physical') {
      if (!phone.validate((v)    => v.trim() ? null : 'Contact phone is required'))      valid = false;
      if (!prefTime.validate((v) => v.trim() ? null : 'Preferred time is required'))     valid = false;
      if (!access.validate((v)   => v.trim() ? null : 'Access details are required'))    valid = false;
    }

    if (!selectedLocation) { setLocationError(true); valid = false; }
    else                   { setLocationError(false); }

    if (!valid) return;

    try {
      setLoading(true);

      await createTask({
        title: title.value.trim(),
        description: description.value.trim(),
        estimatedHours: Number(Number(hours.value).toFixed(1)),
        category: category!,
        creatorId: firebaseUser.uid,
        creatorName: profile?.name || 'Volunteer',
        creatorType: requesterType,
        requesterDetails:
          requesterType === 'juridic'
            ? { organizationName: orgName.value.trim(), representativeName: repName.value.trim(), organizationAddress: orgAddress.value.trim() }
            : { contactPhone: phone.value.trim(), preferredTime: prefTime.value.trim(), accessDetails: access.value.trim() },
        location: selectedLocation!,
      });

      // Reset
      [title, description, hours, orgName, repName, orgAddress, phone, prefTime, access].forEach((f) => f.clear());
      setCategory(null);
      setSelectedLocation(null);
      Alert.alert('✅ Request published!', 'Your task is now visible on the map for volunteers nearby.');
    } catch (error) {
      Alert.alert('Unable to create task', error instanceof Error ? error.message : 'Try again later.');
    } finally {
      setLoading(false);
    }
  };

  // ── Requester type info ──────────────────────────────────────────────────────
  const requesterColors = requesterType
    ? REQUESTER_COLORS[requesterType]
    : null;

  return (
    <SafeAreaView style={ss.safe} edges={['top']}>
      <KeyboardAwareScrollView
        style={ss.flex}
        contentContainerStyle={ss.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={Platform.OS === 'ios' ? 20 : 0}
      >
        {/* ── Header ── */}
          <View style={ss.header}>
            <Text style={ss.headerTitle}>New Help Request</Text>
            <Text style={ss.headerSub}>
              Post a task for nearby volunteers to discover on the map.
            </Text>
          </View>

          {/* ── Profile type badge ── */}
          {requesterType && requesterColors ? (
            <View style={[ss.typeBadge, { backgroundColor: requesterColors.bg }]}>
              <Text style={[ss.typeBadgeText, { color: requesterColors.text }]}>
                {requesterType === 'juridic' ? '🏢  NGO / Organization' : '👤  Individual'}
              </Text>
            </View>
          ) : (
            <View style={ss.noTypeBanner}>
              <Text style={ss.noTypeBannerText}>
                ⚠  Go to your Profile and set your account type before posting a task.
              </Text>
            </View>
          )}

          {/* ── Section 1: Category ── */}
          <SectionHeader label="Category" required />
          <View style={[ss.categoryGrid, categoryError && ss.categoryGridError]}>
            {ALL_CATEGORIES.map((cat) => {
              const meta  = CATEGORY_META[cat];
              const active = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[ss.categoryTile, active && { backgroundColor: meta.bg, borderColor: meta.text }]}
                  onPress={() => { setCategory(active ? null : cat); setCategoryError(false); }}
                  activeOpacity={0.75}
                >
                  <Text style={ss.categoryEmoji}>{meta.emoji}</Text>
                  <Text style={[ss.categoryLabel, active && { color: meta.text }]}>{meta.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {categoryError && <Text style={ss.errorText}>⚠ Please select a category</Text>}

          {/* ── Section 2: Basic info ── */}
          <SectionHeader label="Task Details" required />
          <StyledInput label="Title" field={title} placeholder="e.g. Help moving furniture" />
          <StyledInput label="Description" field={description} multiline lines={4} placeholder="Describe what help is needed…" />

          <View style={ss.hoursWrap}>
            <StyledInput
              label="Estimated Hours"
              field={hours}
              keyboardType="decimal-pad"
              placeholder="e.g. 2.5"
            />
            <Text style={ss.hoursHint}>
              Hours determine how long you expect the task to take. Volunteers earn these as credit.
            </Text>
          </View>

          {/* ── Section 3: Requester details (conditional) ── */}
          {requesterType === 'juridic' && (
            <>
              <SectionHeader label="Organization Details" required />
              <StyledInput label="Organization Name" field={orgName} />
              <StyledInput label="Representative Name" field={repName} />
              <StyledInput label="Organization Address" field={orgAddress} multiline lines={2} />
            </>
          )}

          {requesterType === 'physical' && (
            <>
              <SectionHeader label="Contact Details" required />
              <StyledInput label="Contact Phone" field={phone} keyboardType="phone-pad" />
              <StyledInput label="Preferred Time" field={prefTime} placeholder="e.g. Weekday afternoons" />
              <StyledInput label="Access / Building Details" field={access} multiline lines={2} placeholder="e.g. Ring doorbell #3" />
            </>
          )}

          {/* ── Section 4: Location ── */}
          <SectionHeader label="Task Location" required />
          <View style={[ss.mapContainer, locationError && ss.mapErrorBorder]}>
            <MapView
              provider={PROVIDER_DEFAULT}
              style={ss.map}
              region={mapRegion}
              onRegionChangeComplete={setMapRegion}
              onPress={(e) => {
                setSelectedLocation(e.nativeEvent.coordinate);
                setLocationError(false);
              }}
              showsUserLocation
              showsMyLocationButton={false}
            >
              {selectedLocation && (
                <Marker
                  coordinate={selectedLocation}
                  pinColor={PALETTE.blue500}
                />
              )}
            </MapView>
            <View style={ss.mapOverlay}>
              <TouchableOpacity
                style={ss.myLocationBtn}
                onPress={async () => {
                  try {
                    const permission = await Location.requestForegroundPermissionsAsync();
                    if (permission.status !== 'granted') return;
                    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
                    setSelectedLocation(coords);
                    setLocationError(false);
                    setMapRegion({ ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 });
                  } catch (e) {
                    Alert.alert('Location Error', 'Could not get your current location.');
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={ss.myLocationText}>📍 Use My Location</Text>
              </TouchableOpacity>
              <Text style={ss.mapHint}>Tap on the map to place the task pin</Text>
            </View>
          </View>
          {locationError && <Text style={ss.errorText}>⚠ Please select a location on the map</Text>}

          {/* ── Submit ── */}
          <TouchableOpacity
            style={[ss.submitBtn, (loading || !requesterType) && ss.submitBtnDisabled]}
            onPress={validateAndSubmit}
            disabled={loading || !requesterType}
            activeOpacity={0.85}
          >
            <Text style={ss.submitBtnText}>{loading ? 'Publishing…' : '📍  Publish Request'}</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: PALETTE.slate50 },
  flex:   { flex: 1 },
  scroll: { flex: 1 },
  content:{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 },

  // Header
  header:    { paddingTop: 8, marginBottom: 16 },
  headerTitle:{ fontSize: 28, fontWeight: '700', color: PALETTE.slate900, fontFamily: 'SpaceGrotesk_700Bold' },
  headerSub:  { fontSize: 14, color: PALETTE.slate500, marginTop: 4, fontFamily: 'SpaceGrotesk_400Regular', lineHeight: 20 },

  // Profile type badge
  typeBadge:    { borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 20, alignSelf: 'flex-start' },
  typeBadgeText:{ fontSize: 14, fontWeight: '600', fontFamily: 'SpaceGrotesk_500Medium' },
  noTypeBanner: { backgroundColor: PALETTE.amber100, borderRadius: RADIUS.md, padding: 12, marginBottom: 20 },
  noTypeBannerText:{ fontSize: 13, color: '#92400E', fontFamily: 'SpaceGrotesk_500Medium', lineHeight: 18 },

  // Section header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 10 },
  sectionTitle:  { fontSize: 15, fontWeight: '700', color: PALETTE.slate800, fontFamily: 'SpaceGrotesk_700Bold' },
  required:      { fontSize: 11, color: PALETTE.blue500, fontFamily: 'SpaceGrotesk_500Medium', backgroundColor: PALETTE.blue100, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },

  // Category grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
  },
  categoryGridError: {
    // subtle red tint border via background not border (avoids layout shift)
  },
  categoryTile: {
    width: '30%',
    flexGrow: 1,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: PALETTE.slate200,
    backgroundColor: PALETTE.white,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 6,
    ...SHADOW_SM,
  },
  categoryEmoji: { fontSize: 24 },
  categoryLabel: { fontSize: 11, fontWeight: '600', color: PALETTE.slate600, fontFamily: 'SpaceGrotesk_500Medium', textAlign: 'center' },

  // Field
  fieldWrap:  { marginBottom: 4 },
  input:      { backgroundColor: PALETTE.white },
  inputOutline:      { borderRadius: RADIUS.md, borderColor: PALETTE.slate200 },
  inputOutlineError: { borderColor: PALETTE.red600 },
  errorText:  { fontSize: 12, color: PALETTE.red600, fontFamily: 'SpaceGrotesk_400Regular', marginTop: 4, marginLeft: 2 },

  // Hours
  hoursWrap: { marginBottom: 0 },
  hoursHint: { fontSize: 12, color: PALETTE.slate400, fontFamily: 'SpaceGrotesk_400Regular', marginTop: 4, marginLeft: 2, marginBottom: 4 },

  // Map
  mapContainer: {
    height: 220,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: PALETTE.slate200,
    marginBottom: 4,
  },
  mapErrorBorder: {
    borderColor: '#EF4444', // PALETTE.red500
    borderWidth: 2,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  myLocationBtn: {
    backgroundColor: PALETTE.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    ...SHADOW_SM,
  },
  myLocationText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.slate800,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  mapHint: {
    fontSize: 11,
    color: PALETTE.white,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    fontFamily: 'SpaceGrotesk_500Medium',
  },

  // Submit
  submitBtn: {
    marginTop: 28,
    backgroundColor: PALETTE.blue500,
    borderRadius: RADIUS.xl,
    paddingVertical: 16,
    alignItems: 'center',
    ...SHADOW_MD,
  },
  submitBtnDisabled: {
    backgroundColor: PALETTE.blue400,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.white,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
});
