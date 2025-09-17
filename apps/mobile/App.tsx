import React, { useState, useEffect } from 'react';
import {
  Button,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { lookup as mimeLookup } from 'react-native-mime-types';

const API = process.env.EXPO_PUBLIC_API_BASE;

async function getUploadSignature(folder = 'complaints') {
  const res = await fetch(`${API}/v1/uploads/sign?folder=${folder}`);
  if (!res.ok) throw new Error('Failed to sign upload');
  return res.json();
}

async function uploadToCloudinary(localUri: string) {
  const sign = await getUploadSignature();
  const name = localUri.split('/').pop() || `photo_${Date.now()}.jpg`;
  const type = (mimeLookup(name) as string) || 'image/jpeg';
  const data = new FormData();
  // @ts-ignore: RN file type
  data.append('file', { uri: localUri, name, type });
  data.append('api_key', sign.apiKey);
  data.append('timestamp', String(sign.timestamp));
  data.append('signature', sign.signature);
  data.append('folder', sign.folder);

  const res = await fetch(sign.uploadUrl, { method: 'POST', body: data });
  const json = await res.json();
  if (!json.secure_url) throw new Error('Upload failed');
  return json.secure_url as string;
}

function Raise() {
  const [societyId, setSocietyId] = useState('soc-001');
  const [category, setCategory] = useState('sanitation');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Please allow photo library access to attach images.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      // Support both old and new API shapes
      // @ts-ignore
      const canceled = result.canceled ?? result.cancelled;
      if (canceled) return;
      // @ts-ignore
      const uri = result.assets?.[0]?.uri ?? result.uri;
      if (uri) setImageUri(uri);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to pick image');
    }
  };

  const submit = async () => {
    try {
      setSubmitting(true);

      const media: string[] = [];
      if (imageUri) {
        const url = await uploadToCloudinary(imageUri);
        media.push(url);
      }

      const r = await fetch(`${API}/v1/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ societyId, category, description, media }),
      });

      if (!r.ok) {
        const txt = await r.text();
        throw new Error(txt || 'Failed to create complaint');
      }

      const j = await r.json();
      Alert.alert('Success', `Created: ${j._id || 'unknown id'}`);

      // reset form
      setDescription('');
      setImageUri(null);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text>Society ID</Text>
      <TextInput
        value={societyId}
        onChangeText={setSocietyId}
        style={{ borderWidth: 1, marginBottom: 8, padding: 8 }}
      />

      <Text>Category</Text>
      <TextInput
        value={category}
        onChangeText={setCategory}
        style={{ borderWidth: 1, marginBottom: 8, padding: 8 }}
      />

      <Text>Description</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        multiline
        style={{ borderWidth: 1, marginBottom: 8, padding: 8, minHeight: 80 }}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
        <Button title="Pick Photo" onPress={pickImage} />
        {imageUri ? <Button title="Remove Photo" onPress={() => setImageUri(null)} /> : null}
      </View>

      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{ width: '100%', height: 200, borderRadius: 6, marginBottom: 12 }}
          resizeMode="cover"
        />
      ) : null}

      <View style={{ marginTop: 8 }}>
        {submitting ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ActivityIndicator />
            <Text>Submitting...</Text>
          </View>
        ) : (
          <Button title="Submit Complaint" onPress={submit} />
        )}
      </View>
    </ScrollView>
  );
}

function MyComplaints() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const r = await fetch(`${API}/v1/complaints?societyId=soc-001`);
      if (!r.ok) throw new Error('Failed to load complaints');
      setList(await r.json());
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <ScrollView style={{ padding: 16 }}>
      <View style={{ marginBottom: 8 }}>
        <Button title={loading ? 'Loading...' : 'Reload'} onPress={load} disabled={loading} />
      </View>
      {list.map((c) => (
        <View key={c._id} style={{ borderWidth: 1, marginVertical: 8, padding: 8, borderRadius: 6 }}>
          <Text style={{ fontWeight: '600' }}>{c.category} • {c.status}</Text>
          <Text style={{ marginVertical: 4 }}>{c.description}</Text>
          {Array.isArray(c.media) && c.media.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
              {c.media.map((m: string, idx: number) => (
                <Image
                  key={`${c._id}_${idx}`}
                  source={{ uri: m }}
                  style={{ width: 120, height: 120, marginRight: 8, borderRadius: 4, backgroundColor: '#eee' }}
                />
              ))}
            </ScrollView>
          ) : null}
          <Text style={{ color: '#555' }}>{new Date(c.createdAt).toLocaleString()}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

export default function App() {
  const [tab, setTab] = useState<'raise' | 'mine'>('raise');
  return (
    <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? 24 : 0 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', padding: 8 }}>
        <Button title="Raise" onPress={() => setTab('raise')} />
        <Button title="My Complaints" onPress={() => setTab('mine')} />
      </View>
      {tab === 'raise' ? <Raise /> : <MyComplaints />}
    </SafeAreaView>
  );
}