console.log("ospec in typescript");

// # Spec definition
class Spec {
  before = [];
  beforeEach = [];
  after = [];
  afterEach = [];
  specTimeout = null;
  customAssert = null;
  children = Object.create(null);
}

class OpecBase {
  // hasProcess = typeof process === "object";
  // hasOwn = {}.hasOwnProperty;
  // // const hasSuiteName = arguments.length !== 0
  // only = [];
  // const ospecFileName = getStackName(ensureStackTrace(new Error), /[\/\\](.*?):\d+:\d+/)
  // const rootSpec = new Spec()
  subjects = [];

  // stack-managed globals
  globalBail = false;
  // globalContext = rootSpec;
  globalDepth = 1;
  globalFile = "";
  globalTestOrHook = null;
  globalTimeout = this.noTimeoutRightNow;
  globalTimedOutAndPendingResolution = 0;

  results = null;
  stats = null;
  timeoutStackName = null;

  constructor(private name: string) {}

  private isRunning = () => this.results != null;

  ensureStackTrace(error: any): Error {
    // mandatory to get a stack in IE 10 and 11 (and maybe other envs?)
    if (error.stack === undefined)
      try {
        throw error;
      } catch (e) {
        return e as Error;
      }
    else return error as Error;
  }

  getStackName(e: Error, exp: RegExp) {
    let m = e.stack?.match(exp);
    return (m && m[1]) || null;
  }

  noTimeoutRightNow() {
    throw new Error(
      "`o.timeout()` must be called synchronously from within a test definition or a hook"
    );
  }
}
