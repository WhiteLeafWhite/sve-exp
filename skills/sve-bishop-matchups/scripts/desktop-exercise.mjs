// The native worker receives only the already played prefix. Its normal player
// view presents the hand and legal options with no future choices or result.
export async function loadExercise(query, loadReplay, hasDuelSeats) {
  const file=query.get("replay"), at=query.get("at"), side=query.get("seat");
  if(!/^BP20-[A-Za-z0-9_-]+\.json$/.test(file??"") || !/^(0|[1-9]\d{0,4})$/.test(at??"") ||
     !/^[01]$/.test(side??"")) throw Error("习题的录像名、输入位置或座位无效。");
  const source=await loadReplay(file);
  const cursor=Number(at), seat=Number(side);
  if(cursor>=source.inputs.length || source.inputs[cursor].by!==seat) throw Error("这一步没有轮到所选座位作决定。");
  const controllers=[...source.options.controllers];
  controllers[seat]="human";
  if(file.startsWith("BP20-agents-")) controllers[1-seat]=hasDuelSeats?"duel-coach":seat===1?"bishop-coach":"medium-v2";
  else if(controllers[1-seat]==="human") controllers[1-seat]=seat===1?"bishop-coach":"medium-v2";
  return {kind:"loadReplay",inputs:cursor,replay:{format:"sve-replay",version:1,
    options:{...source.options,controllers,manualActions:false},inputs:source.inputs.slice(0,cursor)}};
}
