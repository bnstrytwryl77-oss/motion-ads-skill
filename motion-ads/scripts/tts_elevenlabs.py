"""Narration straight from ElevenLabs, with exact word timings for captions.

Requires the user's own API key in the environment variable ELEVENLABS_API_KEY
(set it yourself; never paste keys into chat or commit them). No dependencies.

Usage:
    python tts_elevenlabs.py SCRIPT.txt public/narration.mp3 [--voice "Roger"] [--model eleven_v3] [--stability 0.5]

--voice accepts a voice name from your ElevenLabs library or a voice_id.
Writes the MP3 and public/narration.words.json: [{"word", "start", "end"}, ...] (seconds),
plus narration.phrases.json grouped at sentence punctuation. Use the words file for
<Captions> and the phrases for scene timing.

Script tips: write numbers as words, transliterate English names into the target language,
one short paragraph per scene. Hebrew needs a model that supports it (eleven_v3).
"""
import base64
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

API = 'https://api.elevenlabs.io/v1'


def call(path, key, body=None):
    req = urllib.request.Request(API + path, method='POST' if body else 'GET',
                                 headers={'xi-api-key': key, 'Content-Type': 'application/json', 'Accept': 'application/json'},
                                 data=json.dumps(body).encode() if body else None)
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        sys.exit(f'ElevenLabs error {e.code}: {e.read().decode()[:400]}')


def resolve_voice(name_or_id, key):
    voices = call('/voices', key).get('voices', [])
    for v in voices:
        if v['voice_id'] == name_or_id:
            return v['voice_id']
    low = name_or_id.lower()
    for v in voices:
        if v['name'].lower().startswith(low):
            return v['voice_id']
    sys.exit(f'Voice "{name_or_id}" not found. Available: ' + ', '.join(v['name'] for v in voices[:30]))


def to_words(al):
    chars, starts, ends = al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']
    words, cur, s0, e0 = [], '', None, None
    for c, s, e in zip(chars, starts, ends):
        if c.isspace():
            if cur:
                words.append({'word': cur, 'start': round(s0, 3), 'end': round(e0, 3)})
            cur, s0 = '', None
            continue
        if s0 is None:
            s0 = s
        cur += c
        e0 = e
    if cur:
        words.append({'word': cur, 'start': round(s0, 3), 'end': round(e0, 3)})
    return words


def to_phrases(words, gap=0.22):
    out, start, prev_end, text = [], None, None, []
    for w in words:
        if start is None:
            start = w['start']
        elif w['start'] - prev_end > gap:
            out.append({'text': ' '.join(text), 'start': start, 'end': prev_end})
            start, text = w['start'], []
        text.append(w['word'])
        prev_end = w['end']
    if text:
        out.append({'text': ' '.join(text), 'start': start, 'end': prev_end})
    return out


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    key = os.environ.get('ELEVENLABS_API_KEY')
    if not key:
        sys.exit('Set ELEVENLABS_API_KEY in your environment first (the user does this themselves).')
    script_path, out_mp3 = sys.argv[1], sys.argv[2]
    args = dict(zip(sys.argv[3::2], sys.argv[4::2]))
    text = open(script_path, encoding='utf8').read().strip()
    voice = resolve_voice(args.get('--voice', 'Roger'), key)
    body = {'text': text, 'model_id': args.get('--model', 'eleven_v3'),
            'voice_settings': {'stability': float(args.get('--stability', 0.5)), 'similarity_boost': 0.75}}
    res = call(f'/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128', key, body)
    with open(out_mp3, 'wb') as f:
        f.write(base64.b64decode(res['audio_base64']))
    al = res.get('normalized_alignment') or res.get('alignment')
    base = out_mp3.rsplit('.', 1)[0]
    if al:
        words = to_words(al)
        json.dump(words, open(base + '.words.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
        json.dump(to_phrases(words), open(base + '.phrases.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
        print(f'{out_mp3}: {len(words)} words, ends at {words[-1]["end"]:.2f}s')
    else:
        print(f'{out_mp3} written (no alignment returned; run detect_pauses.py --words for estimated timings)')


if __name__ == '__main__':
    main()
