import React, { useState, useEffect, useRef } from 'react';
import { ProjectorScreen, Candidate } from '../../types';
import { api } from '../../services/api';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy, Crown, User, AlertTriangle } from 'lucide-react';

export const ProjectorDisplay: React.FC = () => {
  const [screen, setScreen] = useState<ProjectorScreen>('IDLE');
  const [stageData, setStageData] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [votingUrl, setVotingUrl] = useState<string>('');

  // Animation states for timed sequences
  const [nomineeIndex, setNomineeIndex] = useState<number>(0);
  const [eliminationIndex, setEliminationIndex] = useState<number>(0);
  const [sequenceComplete, setSequenceComplete] = useState<boolean>(false);

  const prevScreenRef = useRef<ProjectorScreen>('IDLE');

  // Fetch projector state every 1.5 seconds
  const fetchState = async () => {
    try {
      const res = await api.getProjectorState('stage');
      setStageData(res);

      if (res.activeScreen !== screen) {
        setScreen(res.activeScreen);
        // Reset sequence indices when screen changes
        setNomineeIndex(0);
        setEliminationIndex(0);
        setSequenceComplete(false);
      }
    } catch (err) {
      console.error('Error fetching projector state:', err);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 1500);
    return () => clearInterval(interval);
  }, [screen]);

  // Set voting URL and generate QR code
  useEffect(() => {
    const origin = window.location.origin;
    const url = `${origin}/vote`;
    setVotingUrl(url);

    QRCode.toDataURL(url, {
      width: 480,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((dataUrl) => setQrDataUrl(dataUrl))
      .catch((err) => console.error('QR code generation error:', err));
  }, []);

  // Handle Confetti when entering TITLE_REVEAL
  useEffect(() => {
    if (screen === 'TITLE_REVEAL' && prevScreenRef.current !== 'TITLE_REVEAL') {
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#ec4899', '#8b5cf6', '#10b981'],
        });
        setTimeout(() => {
          confetti({
            particleCount: 80,
            angle: 60,
            spread: 60,
            origin: { x: 0 },
            colors: ['#f59e0b', '#fbbf24', '#ffffff'],
          });
          confetti({
            particleCount: 80,
            angle: 120,
            spread: 60,
            origin: { x: 1 },
            colors: ['#ec4899', '#f43f5e', '#ffffff'],
          });
        }, 1200);
      } catch (e) {
        // Ignore if confetti not supported
      }
    }
    prevScreenRef.current = screen;
  }, [screen]);

  // Timed Sequence for BOYS_NOMINATIONS & GIRLS_NOMINATIONS (approx 4 seconds per candidate)
  useEffect(() => {
    if (screen !== 'BOYS_NOMINATIONS' && screen !== 'GIRLS_NOMINATIONS') return;

    const list: Candidate[] =
      screen === 'BOYS_NOMINATIONS'
        ? stageData?.data?.nominees?.boys || []
        : stageData?.data?.nominees?.girls || [];

    if (list.length === 0) return;

    if (nomineeIndex < list.length) {
      const timer = setTimeout(() => {
        if (nomineeIndex + 1 < list.length) {
          setNomineeIndex((prev) => prev + 1);
        } else {
          setSequenceComplete(true);
        }
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [screen, nomineeIndex, stageData]);

  // Timed Sequence for BOYS_ELIMINATION & GIRLS_ELIMINATION (approx 3 seconds per candidate)
  useEffect(() => {
    if (screen !== 'BOYS_ELIMINATION' && screen !== 'GIRLS_ELIMINATION') return;

    const eliminatedCandidates: Candidate[] = stageData?.data?.eliminatedCandidates || [];
    const targetGender = screen === 'BOYS_ELIMINATION' ? 'BOY' : 'GIRL';
    const list = eliminatedCandidates.filter((c) => c.gender === targetGender);

    if (list.length === 0) return;

    if (eliminationIndex < list.length) {
      const timer = setTimeout(() => {
        if (eliminationIndex + 1 < list.length) {
          setEliminationIndex((prev) => prev + 1);
        } else {
          setSequenceComplete(true);
        }
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [screen, eliminationIndex, stageData]);

  // -------------------------------------------------------------
  // Render Specific Active Screen (ONE ACTIVE SCREEN ONLY)
  // -------------------------------------------------------------

  // 1. IDLE SCREEN
  if (screen === 'IDLE') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-8 sm:p-16 relative overflow-hidden select-none">
        {/* Ambient lighting & stage glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-amber-500/10 via-rose-500/10 to-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Top bar */}
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-amber-400 font-bold tracking-widest text-sm uppercase">
              {stageData?.settings?.collegeName || 'Apex Institute of Engineering & Technology'}
            </p>
            <p className="text-slate-400 text-xs mt-0.5 tracking-wider">ANNUAL CULTURAL EXTRAVAGANZA</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            LIVE STAGE DISPLAY
          </div>
        </div>

        {/* Hero Event Center */}
        <div className="text-center relative z-10 max-w-4xl mx-auto my-auto">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/30 text-amber-300 text-sm font-bold uppercase tracking-widest mb-6">
            <Sparkles className="w-4 h-4" />
            {stageData?.settings?.eventHeading || 'Fashion, Elegance & Talent'}
          </div>

          <h1 className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tighter bg-gradient-to-r from-amber-200 via-rose-200 to-amber-400 bg-clip-text text-transparent drop-shadow-2xl mb-6">
            {stageData?.settings?.eventName || 'RAMP WALK 2026'}
          </h1>

          <p className="text-2xl sm:text-3xl text-slate-300 font-light tracking-wide max-w-2xl mx-auto leading-relaxed">
            {stageData?.settings?.stageText || 'Welcome to the Most Anticipated Night of Elegance & Stardom'}
          </p>
        </div>

        {/* Bottom bar */}
        <div className="text-center relative z-10 text-xs font-mono text-slate-500 uppercase tracking-widest">
          Stage Display Ready • Managed by Event Administration
        </div>
      </div>
    );
  }

  // 2. BOYS & GIRLS NOMINATION REVEAL (1 by 1 for ~4 seconds)
  if (screen === 'BOYS_NOMINATIONS' || screen === 'GIRLS_NOMINATIONS') {
    const isBoys = screen === 'BOYS_NOMINATIONS';
    const list: Candidate[] = isBoys
      ? stageData?.data?.nominees?.boys || []
      : stageData?.data?.nominees?.girls || [];

    const currentCand = list[nomineeIndex];

    if (sequenceComplete || !currentCand) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8 select-none relative">
          <div className="w-24 h-24 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-6 animate-bounce">
            <Trophy className="w-12 h-12" />
          </div>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white mb-4 uppercase">
            {isBoys ? 'BOYS NOMINATIONS COMPLETE' : 'GIRLS NOMINATIONS COMPLETE'}
          </h1>
          <p className="text-2xl text-amber-400 font-medium">
            All 8 Candidates Officially Nominated for Round 2: Talent Round
          </p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-8 sm:p-12 relative overflow-hidden select-none">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider">
              {isBoys ? 'BOY NOMINEE' : 'GIRL NOMINEE'} #{nomineeIndex + 1} OF 8
            </span>
            <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider">
              Round 1: Official Nominee Reveal
            </span>
          </div>

          <div className="text-sm font-mono text-amber-400">
            Next nominee in 4s...
          </div>
        </div>

        {/* Center Candidate Spotlight */}
        <div className="max-w-4xl mx-auto my-auto w-full flex flex-col md:flex-row items-center gap-10 sm:gap-14 animate-in fade-in zoom-in-95 duration-500">
          {/* Candidate Photo */}
          <div className="w-72 h-96 sm:w-80 sm:h-[430px] rounded-3xl overflow-hidden bg-slate-900 border-4 border-amber-500/40 shadow-2xl shadow-amber-500/20 flex-shrink-0 relative flex items-center justify-center">
            {currentCand.photoUrl ? (
              <img
                src={currentCand.photoUrl}
                alt={currentCand.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center text-slate-600">
                <User className="w-24 h-24 stroke-[1.5]" />
                <span className="text-xs font-mono mt-2">Candidate Photo</span>
              </div>
            )}
            <div className="absolute top-4 left-4 bg-slate-950/90 border border-amber-500 text-amber-400 font-black text-xl px-4 py-1.5 rounded-xl shadow-lg">
              CHEST {currentCand.chestNumber}
            </div>
          </div>

          {/* Details */}
          <div className="text-center md:text-left flex-1">
            <div className="text-amber-400 text-lg font-bold tracking-widest uppercase mb-2">
              Official Nominee
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white tracking-tight mb-4">
              {currentCand.name}
            </h1>
            <div className="inline-block px-5 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-xl font-bold text-amber-300 mb-6">
              Branch: {currentCand.branch}
            </div>
            <p className="text-slate-400 font-mono text-sm">Student ID: {currentCand.id}</p>
          </div>
        </div>

        {/* Progress Bar (4 seconds) */}
        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
          <div
            key={nomineeIndex}
            className="bg-amber-500 h-full animate-[progress_4s_linear]"
            style={{ width: '100%' }}
          />
        </div>
      </div>
    );
  }

  // 3. POINTS TABLE (BOYS or GIRLS)
  if (screen === 'BOYS_POINTS_TABLE' || screen === 'GIRLS_POINTS_TABLE') {
    const isBoys = screen === 'BOYS_POINTS_TABLE';
    const rows = isBoys
      ? stageData?.data?.pointsTable?.boys || []
      : stageData?.data?.pointsTable?.girls || [];

    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-10 select-none flex flex-col justify-between">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white uppercase">
                {isBoys ? 'BOYS POINTS TABLE' : 'GIRLS POINTS TABLE'}
              </h1>
              <p className="text-xs text-slate-400">Round 2: Talent Round • Live Official Standings</p>
            </div>
          </div>

          <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-amber-400 font-bold">
            MAX TOTAL: 400 PTS
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="my-auto overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Chest #</th>
                <th className="py-3 px-4">Candidate Name</th>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4 text-center">Judge 1</th>
                <th className="py-3 px-4 text-center">Judge 2</th>
                <th className="py-3 px-4 text-center">Judge 3</th>
                <th className="py-3 px-4 text-center">Judge 4</th>
                <th className="py-3 px-4 text-right">Total / 400</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {rows.map((row: any, idx: number) => {
                const isTop3 = idx < 3;
                return (
                  <tr
                    key={row.candidate.id}
                    className={`transition-colors ${
                      isTop3 ? 'bg-amber-500/5' : 'hover:bg-slate-900/50'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-black text-lg">
                      {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 font-bold text-xs">
                        #{row.candidate.chestNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white text-base">
                      {row.candidate.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-sm">{row.candidate.branch}</td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                      {row.j1 ?? '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                      {row.j2 ?? '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                      {row.j3 ?? '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                      {row.j4 ?? '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-xl text-amber-400">
                      {row.total}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="text-center text-xs text-slate-500 font-mono">
          Scores calculated automatically by server • Bottom 2 candidates will be eliminated
        </div>
      </div>
    );
  }

  // 4. ELIMINATION REVEAL (RED THEMED FRAME, 1 by 1 for ~3 seconds)
  if (screen === 'BOYS_ELIMINATION' || screen === 'GIRLS_ELIMINATION') {
    const isBoys = screen === 'BOYS_ELIMINATION';
    const eliminatedCandidates: Candidate[] = stageData?.data?.eliminatedCandidates || [];
    const targetGender = isBoys ? 'BOY' : 'GIRL';
    const list = eliminatedCandidates.filter((c) => c.gender === targetGender);

    const currentCand = list[eliminationIndex];

    if (sequenceComplete || !currentCand) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8 select-none text-center">
          <div className="w-20 h-20 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 mb-6">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-4 uppercase">
            {isBoys ? 'BOYS ELIMINATIONS COMPLETE' : 'GIRLS ELIMINATIONS COMPLETE'}
          </h1>
          <p className="text-xl text-slate-400 font-medium max-w-lg">
            Remaining 6 {isBoys ? 'Boys' : 'Girls'} now advance to the prestigious Final Audience Voting!
          </p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-black text-white flex flex-col justify-between p-8 sm:p-12 relative overflow-hidden select-none border-8 border-red-600">
        {/* Red pulse background */}
        <div className="absolute inset-0 bg-red-950/20 pointer-events-none" />

        <div className="flex items-center justify-between relative z-10 border-b border-red-900/60 pb-4">
          <span className="px-4 py-1 rounded-xl bg-red-600 text-white font-black text-sm uppercase tracking-widest">
            {isBoys ? 'BOYS' : 'GIRLS'} ELIMINATION REVEAL
          </span>
          <span className="text-red-400 font-mono text-sm">Official Round 2 Result</span>
        </div>

        {/* Center Spotlight: RED THEMED FRAME */}
        <div className="max-w-2xl mx-auto my-auto w-full text-center relative z-10 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-64 h-80 sm:w-72 sm:h-96 mx-auto rounded-3xl overflow-hidden bg-slate-950 border-4 border-red-600 shadow-2xl shadow-red-600/40 mb-6 relative flex items-center justify-center">
            {currentCand.photoUrl ? (
              <img
                src={currentCand.photoUrl}
                alt={currentCand.name}
                className="w-full h-full object-cover filter grayscale contrast-125"
              />
            ) : (
              <User className="w-24 h-24 text-slate-700" />
            )}
            <div className="absolute top-3 left-3 bg-red-600 text-white font-black text-sm px-3 py-1 rounded-lg">
              CHEST #{currentCand.chestNumber}
            </div>
          </div>

          <h2 className="text-4xl sm:text-5xl font-black text-white mb-2">{currentCand.name}</h2>
          <p className="text-lg text-slate-400 font-semibold mb-6">{currentCand.branch}</p>

          <div className="inline-block px-8 py-3 rounded-2xl bg-red-600 text-white font-black text-2xl tracking-widest uppercase shadow-xl shadow-red-600/40">
            ELIMINATED
          </div>
        </div>

        <div className="relative z-10 text-center text-xs text-red-400/80 font-mono">
          Showing eliminated candidate {eliminationIndex + 1} of {list.length}
        </div>
      </div>
    );
  }

  // 5. QR VOTING SCREEN
  if (screen === 'QR_VOTING') {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8 sm:p-14 flex flex-col justify-between items-center text-center select-none relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-bold uppercase tracking-widest mb-3">
            <Sparkles className="w-4 h-4" />
            Final Voting Open
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tight uppercase">
            SCAN TO VOTE
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 font-light mt-2 max-w-xl mx-auto">
            Cast your vote for <strong className="text-amber-400">Mr. Fresher</strong> and{' '}
            <strong className="text-rose-400">Miss Fresher</strong>
          </p>
        </div>

        {/* QR Code Container */}
        <div className="my-auto relative z-10 p-6 bg-white rounded-3xl shadow-2xl shadow-amber-500/20 border-4 border-amber-400/80">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Voting QR Code" className="w-64 h-64 sm:w-80 sm:h-80" />
          ) : (
            <div className="w-64 h-64 bg-slate-200 animate-pulse rounded-2xl" />
          )}
        </div>

        {/* Voting Link */}
        <div className="relative z-10 max-w-xl">
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Voting Portal URL</p>
          <div className="font-mono text-lg sm:text-xl text-amber-400 font-bold bg-slate-900/90 border border-slate-800 py-3 px-6 rounded-2xl shadow-inner break-all">
            {votingUrl || window.location.origin}
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Strict Security: Exactly 1 Boy + 1 Girl vote per verified device.
          </p>
        </div>
      </div>
    );
  }

  // 6. FINAL RESULTS SCREEN
  if (screen === 'FINAL_RESULTS') {
    const boysResults = stageData?.data?.results?.boysResults;
    const girlsResults = stageData?.data?.results?.girlsResults;

    return (
      <div className="min-h-screen bg-slate-950 text-white p-8 sm:p-12 flex flex-col justify-between select-none">
        <div className="text-center border-b border-slate-800 pb-4">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Trophy className="w-3.5 h-3.5" />
            Official Event Results
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight uppercase">
            AUDIENCE VOTING RESULTS
          </h1>
        </div>

        {/* Dual Winners Spotlight */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto my-auto w-full">
          {/* Mr Fresher */}
          <div className="bg-slate-900/90 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 font-black text-xs px-4 py-1 rounded-bl-xl uppercase tracking-wider">
              {boysResults?.title1?.titleName || 'Mr. Fresher'}
            </div>

            <div className="w-40 h-52 mx-auto rounded-2xl overflow-hidden bg-slate-950 border-2 border-amber-500/40 mb-4 shadow-lg flex items-center justify-center">
              {boysResults?.title1?.winner?.candidate?.photoUrl ? (
                <img
                  src={boysResults.title1.winner.candidate.photoUrl}
                  alt="Mr Fresher"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-slate-600" />
              )}
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              {boysResults?.title1?.winner?.candidate?.name || 'TBD'}
            </h3>
            <p className="text-amber-400 font-semibold text-sm">
              {boysResults?.title1?.winner?.candidate?.branch}
            </p>
            <div className="mt-4 inline-block px-4 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-black text-base">
              {boysResults?.title1?.winner?.votes || 0} Votes
            </div>
          </div>

          {/* Miss Fresher */}
          <div className="bg-slate-900/90 border-2 border-rose-500/50 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-rose-500 text-slate-950 font-black text-xs px-4 py-1 rounded-bl-xl uppercase tracking-wider">
              {girlsResults?.title1?.titleName || 'Miss Fresher'}
            </div>

            <div className="w-40 h-52 mx-auto rounded-2xl overflow-hidden bg-slate-950 border-2 border-rose-500/40 mb-4 shadow-lg flex items-center justify-center">
              {girlsResults?.title1?.winner?.candidate?.photoUrl ? (
                <img
                  src={girlsResults.title1.winner.candidate.photoUrl}
                  alt="Miss Fresher"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-slate-600" />
              )}
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              {girlsResults?.title1?.winner?.candidate?.name || 'TBD'}
            </h3>
            <p className="text-rose-400 font-semibold text-sm">
              {girlsResults?.title1?.winner?.candidate?.branch}
            </p>
            <div className="mt-4 inline-block px-4 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-black text-base">
              {girlsResults?.title1?.winner?.votes || 0} Votes
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 font-mono">
          Final Validated Results • Ramp Walk 2026
        </div>
      </div>
    );
  }

  // 7. TITLE REVEAL (ALL 6 TITLES WITH PODIUM PRESENTATION)
  if (screen === 'TITLE_REVEAL') {
    const boysResults = stageData?.data?.results?.boysResults;
    const girlsResults = stageData?.data?.results?.girlsResults;

    const titlesList = [
      // Boys
      {
        gender: 'BOYS',
        title: boysResults?.title1?.titleName || 'Mr. Fresher',
        candidate: boysResults?.title1?.winner?.candidate,
        source: 'Audience Voting Champion',
        badgeColor: 'from-amber-400 to-amber-500',
      },
      {
        gender: 'BOYS',
        title: boysResults?.title2?.titleName || 'Mr. Handsome',
        candidate: boysResults?.title2?.winner?.candidate,
        source: 'Talent Round 2 Points Rank #1',
        badgeColor: 'from-blue-400 to-indigo-500',
      },
      {
        gender: 'BOYS',
        title: boysResults?.title3?.titleName || 'Mr. Perfect',
        candidate: boysResults?.title3?.winner?.candidate,
        source: 'Talent Round 2 Points Rank #2',
        badgeColor: 'from-purple-400 to-purple-600',
      },
      // Girls
      {
        gender: 'GIRLS',
        title: girlsResults?.title1?.titleName || 'Miss Fresher',
        candidate: girlsResults?.title1?.winner?.candidate,
        source: 'Audience Voting Champion',
        badgeColor: 'from-rose-400 to-pink-500',
      },
      {
        gender: 'GIRLS',
        title: girlsResults?.title2?.titleName || 'Miss Beautiful',
        candidate: girlsResults?.title2?.winner?.candidate,
        source: 'Talent Round 2 Points Rank #1',
        badgeColor: 'from-emerald-400 to-teal-500',
      },
      {
        gender: 'GIRLS',
        title: girlsResults?.title3?.titleName || 'Miss Perfect',
        candidate: girlsResults?.title3?.winner?.candidate,
        source: 'Talent Round 2 Points Rank #2',
        badgeColor: 'from-violet-400 to-fuchsia-500',
      },
    ];

    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-10 flex flex-col justify-between select-none">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-widest mb-2">
            <Crown className="w-4 h-4" />
            Official Title Crowning Ceremony
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight uppercase">
            RAMP WALK 2026 TITLE WINNERS
          </h1>
        </div>

        {/* 6 Titles Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 my-auto">
          {titlesList.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 text-center shadow-xl flex flex-col justify-between"
            >
              <div>
                <div
                  className={`w-full py-1.5 px-2 rounded-xl bg-gradient-to-r ${item.badgeColor} text-slate-950 font-black text-xs uppercase tracking-wider mb-3 shadow`}
                >
                  {item.title}
                </div>

                <div className="w-24 h-32 mx-auto rounded-xl overflow-hidden bg-slate-950 border border-slate-800 mb-3 flex items-center justify-center">
                  {item.candidate?.photoUrl ? (
                    <img
                      src={item.candidate.photoUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-slate-700" />
                  )}
                </div>

                <h4 className="font-extrabold text-white text-base leading-tight mb-1">
                  {item.candidate?.name || 'TBD'}
                </h4>
                <p className="text-xs text-slate-400">{item.candidate?.branch || '—'}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
                {item.source}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center text-xs text-slate-500 font-mono">
          Heartiest Congratulations to All Ramp Walk 2026 Title Holders!
        </div>
      </div>
    );
  }

  // Fallback
  return null;
};
