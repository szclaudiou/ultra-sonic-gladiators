"""
Ultra Sonic Gladiators — Final Battle Music
3-Phase Structure:
  Phase 1: Argentum Solo (30 seconds at 130 BPM = 65 beats = ~16.25 bars)
  Phase 2: Morgana Solo (30 seconds = same)
  Phase 3: Clash (60 seconds = 130 beats = ~32.5 bars)

Each phase generates BOTH instrument tracks (for the mix) but in Phase 1/2
only one plays for the player while the other is ambient/quiet.

We also export beat maps as JSON for the rhythm game.
"""

import os
import json
import subprocess
from midiutil import MIDIFile

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
AUDIO_DIR = os.path.join(BASE_DIR, "assets", "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

FLUIDSYNTH = r"C:\tools\fluidsynth\fluidsynth-v2.5.2-win10-x64-glib\bin\fluidsynth.exe"
SOUNDFONT = r"C:\tools\fluidsynth\MuseScore_General.sf2"
FFMPEG = r"C:\Users\jrodo\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0.1-full_build\bin\ffmpeg.exe"

BPM = 130
BEATS_PER_BAR = 4
CHURCH_ORGAN = 19
CELLO = 42

# 30 seconds = 65 beats, 60 seconds = 130 beats
PHASE_1_BEATS = 65
PHASE_2_BEATS = 65
PHASE_3_BEATS = 130

beat_map_argentum = []  # [{beat, lane, type}]
beat_map_morgana = []


def add_to_beatmap(beatmap, beat, lane, note_type="normal", phase=1):
    """Add a rhythm game note to the beat map.
    lane: 0-3 (4 lanes like Guitar Hero)
    note_type: 'normal', 'accent', 'hold'
    """
    time_seconds = beat * 60.0 / BPM
    beatmap.append({
        "beat": round(beat, 3),
        "time": round(time_seconds, 3),
        "lane": lane,
        "type": note_type,
        "phase": phase,
    })


# ============================================================
# ARGENTUM — Power Metal Cello (all 3 phases)
# ============================================================
def compose_argentum_full():
    midi = MIDIFile(1)
    tr, ch = 0, 0
    midi.addTrackName(tr, 0, "Argentum - Cello")
    midi.addTempo(tr, 0, BPM)
    midi.addProgramChange(tr, ch, 0, CELLO)
    midi.addControllerEvent(tr, ch, 0, 7, 115)

    def n(p, t, d, v=95):
        if p is not None:
            midi.addNote(tr, ch, p, t, d, v)

    # ---- PHASE 1: Argentum Solo (beats 0-65) ----
    # This is the player's showpiece. Memorable, heroic, with clear rhythm hits.
    
    # Bars 1-2: Opening power riff (THE RIFF — galloping)
    t = 0
    for bar in range(2):
        bt = t + bar * 4
        # Gallop: short-short-LONG
        n(50, bt, 0.33, 108); add_to_beatmap(beat_map_argentum, bt, 1, "normal", 1)
        n(50, bt+0.33, 0.33, 95)
        n(57, bt+0.66, 1.34, 115); add_to_beatmap(beat_map_argentum, bt+0.66, 2, "accent", 1)
        n(53, bt+2, 0.33, 108); add_to_beatmap(beat_map_argentum, bt+2, 1, "normal", 1)
        n(53, bt+2.33, 0.33, 95)
        n(62, bt+2.66, 1.34, 115); add_to_beatmap(beat_map_argentum, bt+2.66, 2, "accent", 1)

    # Bars 3-6: ARGENTUM'S THEME — the hero melody
    t = 8
    theme_notes = [
        (62, 1.5, 108, 0), (65, 0.5, 98, 1), (69, 2, 115, 2),    # D4. F4 A4--
        (72, 1, 108, 3), (74, 1, 112, 2),                           # C5 D5
        (72, 0.5, 100, 3), (70, 0.5, 1, 98), (69, 1, 105, 2),     # C5 Bb4 A4
        (65, 1, 100, 1), (62, 2, 110, 0),                           # F4 D4--
        (60, 0.5, 90, 0), (62, 1.5, 105, 0),                        # C4 D4
        (65, 1, 100, 1), (67, 1, 108, 1),                           # F4 G4
        (69, 2, 112, 2),                                              # A4--
    ]
    beat = t
    for item in theme_notes:
        if len(item) == 4:
            p, d, v, lane = item
        else:
            p, d, v = item[:3]; lane = 1
        n(p, beat, d, v)
        add_to_beatmap(beat_map_argentum, beat, lane, "accent" if v >= 110 else "normal", 1)
        beat += d

    # Bars 7-8: Rhythmic accent hits (clear rhythm game moments)
    t = 24
    accents = [
        (62, 0.5, 112, 0), (None, 0.5, 0, -1),
        (65, 0.5, 110, 1), (None, 0.5, 0, -1),
        (69, 0.5, 115, 2), (None, 0.5, 0, -1),
        (74, 1, 120, 3),
        (72, 0.5, 108, 3), (69, 0.5, 105, 2),
        (65, 0.5, 100, 1), (62, 0.5, 98, 0),
        (57, 1, 110, 1), (50, 1, 108, 0),
    ]
    beat = t
    for p, d, v, lane in accents:
        if p is not None:
            n(p, beat, d, v)
            add_to_beatmap(beat_map_argentum, beat, lane, "accent" if v >= 110 else "normal", 1)
        beat += d

    # Bars 9-12: Theme variation with faster ornamental notes
    t = 32
    variation = [
        (62, 0.5, 105, 0), (64, 0.5, 95, 1), (65, 1, 108, 1),
        (69, 1, 112, 2), (72, 1, 110, 3),
        (74, 0.5, 115, 3), (76, 0.5, 108, 3),
        (77, 2, 118, 3),  # F5 high peak!
        (76, 0.5, 105, 3), (74, 0.5, 100, 2),
        (72, 1, 98, 3), (70, 1, 95, 2),
        (69, 1, 100, 2), (67, 1, 98, 1),
        (65, 2, 105, 1), (62, 2, 108, 0),
    ]
    beat = t
    for p, d, v, lane in variation:
        n(p, beat, d, v)
        add_to_beatmap(beat_map_argentum, beat, lane, "accent" if v >= 110 else "normal", 1)
        beat += d

    # Bars 13-16: Building finale — fast ascending run + power note
    t = 48
    # Ascending scale run
    run = [50, 53, 55, 57, 60, 62, 65, 67, 69, 72, 74, 77]
    for i, p in enumerate(run):
        n(p, t + i*0.25, 0.25, 95 + i*2)
        if i % 2 == 0:  # every other note is a hit
            add_to_beatmap(beat_map_argentum, t + i*0.25, i % 4, "normal", 1)
    # Power chord ending
    n(74, t+4, 2, 120); add_to_beatmap(beat_map_argentum, t+4, 2, "accent", 1)
    n(62, t+4, 2, 115)
    n(50, t+4, 2, 110)
    # Final gallop hits
    for i in range(4):
        bt = t + 6 + i
        n(50, bt, 0.33, 105)
        n(57, bt+0.33, 0.33, 100)
        n(62, bt+0.66, 0.34, 110)
        add_to_beatmap(beat_map_argentum, bt, i % 4, "normal", 1)
    
    # Held note to finish phase 1 (beat ~62-65)
    n(62, t+10, 4, 105); add_to_beatmap(beat_map_argentum, t+10, 0, "accent", 1)

    # ---- PHASE 2: Morgana's turn (beats 65-130) ----
    # Argentum plays AMBIENT — quiet held notes and subtle response
    t = 65
    # Quiet sustained chords reacting to Morgana's attacks
    ambient_chords = [
        ([50, 57], 0, 8, 50),
        ([50, 62], 8, 8, 45),
        ([50, 57], 16, 8, 50),
        ([50, 65], 24, 8, 45),
        ([50, 57, 62], 32, 16, 40),
        ([50, 57], 48, 16, 35),
    ]
    for pitches, offset, dur, vel in ambient_chords:
        for p in pitches:
            n(p, t + offset, dur, vel)

    # ---- PHASE 3: The Clash (beats 130-260) ----
    # Full intensity — theme at double speed, aggressive
    t = 130

    # Bars 1-4: Theme at double speed
    fast_theme = [
        (62, 0.75, 112, 0), (65, 0.25, 100, 1),
        (69, 1, 118, 2), (72, 0.5, 110, 3), (74, 0.5, 115, 3),
        (72, 0.25, 105, 3), (70, 0.25, 100, 2), (69, 0.5, 108, 2), (65, 0.5, 102, 1),
        (62, 1, 115, 0),
    ]
    for rep in range(3):
        beat = t + rep * 5
        for p, d, v, lane in fast_theme:
            n(p, beat, d, min(v + rep*3, 127))
            add_to_beatmap(beat_map_argentum, beat, lane, "accent" if v >= 110 else "normal", 3)
            beat += d

    # Bars 5-8: Galloping fury
    t2 = t + 16
    for bar in range(4):
        for sub in range(4):
            bt = t2 + bar*4 + sub
            n(50, bt, 0.33, 110)
            n(50, bt+0.33, 0.33, 95)
            n(57, bt+0.66, 0.34, 118)
            add_to_beatmap(beat_map_argentum, bt, sub % 4, "normal", 3)
            add_to_beatmap(beat_map_argentum, bt+0.66, (sub+1) % 4, "accent", 3)

    # Bars 9-16: Arpeggiated assault
    t3 = t + 32
    arps = [
        [50, 57, 62, 69, 74, 69, 62, 57],
        [53, 58, 65, 70, 77, 70, 65, 58],
        [48, 55, 60, 67, 72, 67, 60, 55],
        [45, 52, 57, 64, 69, 76, 81, 76],
    ]
    for ai, arp in enumerate(arps):
        for rep in range(2):
            for ni, p in enumerate(arp):
                b = t3 + ai*8 + rep*4 + ni*0.5
                n(p, b, 0.5, 100 + (ni==4)*15)
                if ni % 2 == 0:
                    add_to_beatmap(beat_map_argentum, b, ni % 4, "normal", 3)

    # Bars 17-24: Heroic theme FINAL — fortissimo
    t4 = t + 64
    final_theme = [
        (62, 1.5, 115, 0), (65, 0.5, 105, 1), (69, 2, 120, 2),
        (72, 1, 112, 3), (74, 1, 118, 3),
        (77, 2, 120, 3), (81, 2, 122, 3),
        (84, 2, 125, 3),  # C6!
        (81, 1, 118, 3), (77, 1, 115, 3),
        (74, 2, 120, 2), (69, 2, 112, 2),
        (62, 4, 118, 0),
    ]
    beat = t4
    for p, d, v, lane in final_theme:
        n(p, beat, d, v)
        add_to_beatmap(beat_map_argentum, beat, lane, "accent", 3)
        beat += d

    # Bars 25-32: Climax — fast power chords + final slam
    t5 = t + 96
    for i in range(16):
        p = [50, 53, 57, 62][i % 4]
        n(p, t5 + i*0.5, 0.5, 110 + (i % 4 == 0)*10)
        n(p+12, t5 + i*0.5, 0.5, 105 + (i % 4 == 0)*10)
        add_to_beatmap(beat_map_argentum, t5 + i*0.5, i % 4, "normal", 3)

    # Final held power note
    for p in [38, 50, 62, 74]:
        n(p, t5 + 8, 8, 120)
    add_to_beatmap(beat_map_argentum, t5 + 8, 2, "accent", 3)

    # Tremolo ending
    for i in range(32):
        n(62 if i%2==0 else 74, t5+16+i*0.25, 0.25, 100+i)
        if i % 4 == 0:
            add_to_beatmap(beat_map_argentum, t5+16+i*0.25, i%4, "normal", 3)

    # Grand finale chord
    for p in [38, 50, 62, 74, 86]:
        n(p, t5+24, 6, 125)
    add_to_beatmap(beat_map_argentum, t5+24, 2, "accent", 3)

    return midi


# ============================================================
# MORGANA VEX — Gothic Pipe Organ (all 3 phases)
# ============================================================
def compose_morgana_full():
    midi = MIDIFile(1)
    tr, ch = 0, 0
    midi.addTrackName(tr, 0, "Morgana Vex - Organ")
    midi.addTempo(tr, 0, BPM)
    midi.addProgramChange(tr, ch, 0, CHURCH_ORGAN)
    midi.addControllerEvent(tr, ch, 0, 7, 112)
    midi.addControllerEvent(tr, ch, 0, 91, 90)

    def n(p, t, d, v=90):
        if p is not None:
            midi.addNote(tr, ch, p, t, d, v)

    def chord(ps, t, d, v=85):
        for p in ps:
            n(p, t, d, v)

    # ---- PHASE 1: Argentum's turn (beats 0-65) ----
    # Morgana ambient — ominous drone, barely there
    n(38, 0, 32, 40)
    n(45, 0, 32, 35)
    n(38, 32, 33, 40)
    n(50, 32, 33, 35)

    # ---- PHASE 2: Morgana Solo (beats 65-130) ----
    t = 65

    # Bars 1-2: Emerging from darkness — single pedal
    n(38, t, 8, 75)
    n(62, t+4, 1.5, 60)
    n(61, t+5.5, 0.5, 55)
    n(62, t+6, 2, 65)
    add_to_beatmap(beat_map_morgana, t+4, 0, "normal", 2)
    add_to_beatmap(beat_map_morgana, t+6, 0, "normal", 2)

    # Bars 3-4: Web takes shape
    n(38, t+8, 8, 78)
    n(45, t+8, 4, 65)
    n(53, t+10, 2, 60)
    n(57, t+12, 4, 70)
    n(62, t+12, 4, 72)
    add_to_beatmap(beat_map_morgana, t+8, 1, "normal", 2)
    add_to_beatmap(beat_map_morgana, t+10, 1, "normal", 2)
    add_to_beatmap(beat_map_morgana, t+12, 2, "accent", 2)

    # Bars 5-8: Widow's Theme — asymmetric, creepy
    t2 = t + 16
    n(38, t2, 16, 72)
    chord([53, 57], t2, 16, 60)
    theme = [
        (74, 3, 88, 3), (73, 1, 82, 2), (74, 1, 85, 3),
        (72, 2, 80, 2), (70, 1, 82, 2),
        (69, 2, 85, 1), (70, 1, 78, 2), (72, 1, 82, 2),
        (74, 2, 88, 3), (77, 2, 92, 3),
    ]
    beat = t2
    for p, d, v, lane in theme:
        n(p, beat, d, v)
        add_to_beatmap(beat_map_morgana, beat, lane, "accent" if v >= 85 else "normal", 2)
        beat += d

    # Bars 9-12: Venom Strike — sudden dissonant attacks
    t3 = t + 32
    strikes = [
        ([38, 50, 62, 63, 65], 0.5, 108, 0),
        (None, 0.25, 0, -1),
        ([38, 50, 62, 63, 65], 0.5, 105, 1),
        (None, 0.75, 0, -1),
        ([43, 55, 67, 68, 70], 0.5, 110, 2),
        (None, 0.25, 0, -1),
        ([43, 55, 67, 68, 70], 0.5, 108, 3),
        (None, 0.75, 0, -1),
        ([45, 49, 57, 61, 64], 0.5, 112, 0),
        ([45, 49, 57, 61, 64], 0.25, 105, 1),
        ([45, 49, 57, 61, 64], 0.25, 108, 2),
        (None, 0.5, 0, -1),
        ([26, 38, 50, 62, 63, 65, 68, 74], 3, 115, 3),
        ([26, 38, 50, 57, 62, 65, 74], 2, 100, 2),
    ]
    beat = t3
    for item in strikes:
        ps, d, v, lane = item
        if ps is not None:
            if isinstance(ps, list):
                chord(ps, beat, d, v)
            else:
                n(ps, beat, d, v)
            if lane >= 0:
                add_to_beatmap(beat_map_morgana, beat, lane, "accent" if v >= 108 else "normal", 2)
        beat += d

    # Bars 13-16: Web of Thorns — staccato trap
    t4 = t + 48
    web = [
        ([38, 57, 62, 65], 0.5, 100, 0),
        (None, 0.25, 0, -1),
        ([41, 53, 60, 65], 0.5, 98, 1),
        (None, 0.25, 0, -1),
        ([43, 55, 58, 67], 0.5, 102, 2),
        (None, 0.25, 0, -1),
        ([44, 56, 59, 68], 0.5, 105, 3),
        (None, 0.25, 0, -1),
        ([45, 57, 60, 69], 0.5, 108, 0),
        (None, 0.25, 0, -1),
        ([45, 49, 57, 61], 0.75, 110, 1),
        (None, 0.25, 0, -1),
        ([26, 38, 50, 57, 62, 65, 69, 74], 2, 115, 2),
        (None, 0.5, 0, -1),
        ([26, 38, 50, 57, 62, 65, 69, 74], 1.5, 112, 3),
    ]
    beat = t4
    for item in web:
        ps, d, v, lane = item
        if ps is not None:
            if isinstance(ps, list):
                chord(ps, beat, d, v)
            else:
                n(ps, beat, d, v)
            if lane >= 0:
                add_to_beatmap(beat_map_morgana, beat, lane, "accent" if v >= 108 else "normal", 2)
        beat += d

    # Remaining beats: held dark chord fading
    chord([38, 50, 57, 62], beat, 65 - (beat - t), 80)

    # ---- PHASE 3: The Clash (beats 130-260) ----
    t = 130

    # Full intensity organ — counterpoint to Argentum
    # Bars 1-4: Relentless chord progression
    prog = [
        [38, 50, 57, 62, 65],    # Dm
        [36, 48, 55, 60, 64],    # C
        [34, 46, 53, 58, 62],    # Bb
        [33, 45, 49, 57, 61],    # A7
    ]
    for rep in range(2):
        for i, ch_notes in enumerate(prog):
            bt = t + rep*16 + i*4
            chord(ch_notes, bt, 3.5, 105 + i*3)
            add_to_beatmap(beat_map_morgana, bt, i % 4, "accent", 3)
            # Melodic hits on off-beats
            n(74 - i*2, bt+2, 1, 95)
            add_to_beatmap(beat_map_morgana, bt+2, (i+2) % 4, "normal", 3)

    # Bars 9-16: Fugue — running countermelody against Argentum
    t2 = t + 32
    fugue_subject = [
        (74,1,90,3), (72,0.5,85,2), (74,0.5,88,3), (77,1,92,3),
        (76,0.5,85,3), (74,0.5,88,2), (72,1,85,2), (70,0.5,82,2),
        (69,0.5,85,1), (67,1,88,1), (69,1,90,1),
    ]
    for rep in range(3):
        beat = t2 + rep * 12
        for p, d, v, lane in fugue_subject:
            n(p - rep*5, beat, d, v)  # transposition each time
            add_to_beatmap(beat_map_morgana, beat, lane, "normal", 3)
            beat += d
    # Bass pedal
    n(38, t2, 36, 75)

    # Bars 17-24: Spider Dance — staccato rhythm
    t3 = t + 64
    for bar in range(8):
        bt = t3 + bar * 4
        # Stab pattern
        chord([38, 50, 57, 62, 65], bt, 0.75, 105 + bar*2)
        add_to_beatmap(beat_map_morgana, bt, 0, "accent", 3)
        chord([38, 50, 57, 62, 65], bt+1.5, 0.5, 98 + bar*2)
        add_to_beatmap(beat_map_morgana, bt+1.5, 1, "normal", 3)
        chord([43, 55, 58, 67], bt+2.5, 0.75, 102 + bar*2)
        add_to_beatmap(beat_map_morgana, bt+2.5, 2, "accent", 3)

    # Bars 25-32: Grand finale — massive chords building
    t4 = t + 96
    for i in range(8):
        base = 38 + i
        chord([base, base+12, base+19, base+24], t4+i*2, 1.5, 105+i*2)
        add_to_beatmap(beat_map_morgana, t4+i*2, i % 4, "accent", 3)

    # The kill chord
    chord([26, 38, 50, 57, 62, 65, 69, 74, 77, 81], t4+16, 6, 125)
    add_to_beatmap(beat_map_morgana, t4+16, 2, "accent", 3)

    # Tremolo ending
    for i in range(24):
        p = 74 if i%2==0 else 75  # D5/Eb5 — dissonant
        n(p, t4+22+i*0.25, 0.25, 90+i)
        if i % 4 == 0:
            add_to_beatmap(beat_map_morgana, t4+22+i*0.25, i%4, "normal", 3)

    # Final Dm
    chord([26, 38, 50, 57, 62, 65, 74, 81], t4+28, 4, 120)
    add_to_beatmap(beat_map_morgana, t4+28, 3, "accent", 3)

    return midi


# ============================================================
# RENDER
# ============================================================
def save_midi(midi_obj, filename):
    path = os.path.join(AUDIO_DIR, filename)
    with open(path, "wb") as f:
        midi_obj.writeFile(f)
    print(f"  MIDI: {path}")
    return path

def render_to_wav(midi_path, wav_path):
    cmd = [FLUIDSYNTH, "-ni", "-a", "file", "-T", "wav",
           "-g", "2.0", "-F", wav_path, "-r", "44100",
           SOUNDFONT, midi_path]
    subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    return wav_path

def wav_to_mp3(wav_path, mp3_path):
    subprocess.run([FFMPEG, "-y", "-i", wav_path, "-c:a", "libmp3lame", "-q:a", "2", mp3_path],
                   capture_output=True, timeout=30)
    os.remove(wav_path)
    print(f"  MP3: {mp3_path}")
    return mp3_path

def wav_to_ogg(wav_path, ogg_path):
    subprocess.run([FFMPEG, "-y", "-i", wav_path, "-c:a", "libvorbis", "-q:a", "6", ogg_path],
                   capture_output=True, timeout=30)
    os.remove(wav_path)
    print(f"  OGG: {ogg_path}")
    return ogg_path

def mix_tracks(t1, t2, out):
    subprocess.run([FFMPEG, "-y", "-i", t1, "-i", t2,
                    "-filter_complex", "[0:a][1:a]amix=inputs=2:duration=longest:dropout_transition=2[out]",
                    "-map", "[out]", "-c:a", "libvorbis", "-q:a", "6", out],
                   capture_output=True, timeout=30)
    print(f"  Mixed: {out}")


def main():
    print("=== USG Final Battle Music ===\n")

    print("Composing Argentum (Cello)...")
    argentum = compose_argentum_full()
    argentum_mid = save_midi(argentum, "argentum.mid")

    print("Composing Morgana (Organ)...")
    morgana = compose_morgana_full()
    morgana_mid = save_midi(morgana, "morgana.mid")

    print("\nRendering...")
    a_wav = render_to_wav(argentum_mid, os.path.join(AUDIO_DIR, "argentum.wav"))
    m_wav = render_to_wav(morgana_mid, os.path.join(AUDIO_DIR, "morgana.wav"))

    print("\nConverting to OGG (web-friendly)...")
    a_ogg = wav_to_ogg(a_wav, os.path.join(AUDIO_DIR, "argentum.ogg"))
    m_ogg = wav_to_ogg(m_wav, os.path.join(AUDIO_DIR, "morgana.ogg"))

    # Also render the mix for preview
    a_wav2 = render_to_wav(argentum_mid, os.path.join(AUDIO_DIR, "argentum_tmp.wav"))
    m_wav2 = render_to_wav(morgana_mid, os.path.join(AUDIO_DIR, "morgana_tmp.wav"))
    mix_tracks(a_wav2, m_wav2, os.path.join(AUDIO_DIR, "battle-mix.ogg"))
    # clean up temp wavs
    for f in [a_wav2, m_wav2]:
        if os.path.exists(f): os.remove(f)

    # Save beat maps
    print("\nSaving beat maps...")
    with open(os.path.join(AUDIO_DIR, "beatmap-argentum.json"), "w") as f:
        json.dump({"bpm": BPM, "character": "argentum", "notes": beat_map_argentum}, f, indent=2)
    with open(os.path.join(AUDIO_DIR, "beatmap-morgana.json"), "w") as f:
        json.dump({"bpm": BPM, "character": "morgana", "notes": beat_map_morgana}, f, indent=2)

    print(f"\nBeat map stats:")
    print(f"  Argentum: {len(beat_map_argentum)} rhythm notes")
    print(f"  Morgana: {len(beat_map_morgana)} rhythm notes")
    print(f"\nDone! All files in: {AUDIO_DIR}")


if __name__ == "__main__":
    main()
