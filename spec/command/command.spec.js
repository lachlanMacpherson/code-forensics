var childProcess = require('child_process'),
    stream       = require('stream');

var command = require_src('command'),
    cmdDefinitions = require_src('command/command_definitions');

describe('command', function() {
  beforeEach(function() {
    spyOn(cmdDefinitions, 'getDefinition').and.returnValue({
      cmd: 'path/to/executable',
      args: ['--param1', '--param2', '-a', '-b']
    });
    spyOn(process.stderr, 'write');
  });

  afterEach(function() {
    expect(cmdDefinitions.getDefinition).toHaveBeenCalledWith('test-command');
  });

  describe('.run()', function() {
    beforeEach(function() {
      spyOn(childProcess, 'spawnSync').and.returnValue({
        stdout: 'test output',
        stderr: 'test err'
      });

      this.cmdOutput = command.run('test-command', ['arg1', 'arg2'], {opt1: 123, opt2: 'abc'});
    });

    it('spawns the process with the expected parameters', function() {
      expect(childProcess.spawnSync).toHaveBeenCalledWith('path/to/executable', [
        '--param1', '--param2', '-a', '-b', 'arg1', 'arg2'
      ], { opt1: 123, opt2: 'abc' });
    });

    it('returns the gitlog_analysis command output', function() {
      expect(this.cmdOutput).toBe('test output');
    });
  });

  describe('.stream()', function() {
    var spawnOutput;
    beforeEach(function() {
      spawnOutput = {
        stdout: new stream.Readable(),
        stderr: new stream.Readable()
      };
      spyOn(childProcess, 'spawn').and.returnValue(spawnOutput);
      spawnOutput.stdout.push('test output');
      spawnOutput.stdout.push(null);
      spawnOutput.stderr.push('test err');
      spawnOutput.stderr.push(null);
      spyOn(spawnOutput.stderr, 'pipe');

      this.cmdStream = command.stream('test-command', ['arg1', 'arg2'], {opt1: 123, opt2: 'abc'});
    });

    it('spawns the process with the expected parameters', function() {
      expect(childProcess.spawn).toHaveBeenCalledWith('path/to/executable', [
        '--param1', '--param2', '-a', '-b', 'arg1', 'arg2'
      ], { opt1: 123, opt2: 'abc' });
    });

    it('returns the gitlog_analysis command output stream', function() {
      expect(this.cmdStream.read().toString()).toEqual('test output');
    });

    it('dumps command stderr stream', function() {
      expect(spawnOutput.stderr.pipe).toHaveBeenCalled();
    });
  });

  describe('.create()', function() {
    it('returns a synchronous child process', function() {
      spyOn(childProcess, 'spawnSync').and.returnValue('sync process');

      var proc = command.create('test-command', ['arg1', 'arg2'], {opt1: 123, opt2: 'abc'}).syncProcess();
      expect(proc).toEqual('sync process');
      expect(childProcess.spawnSync).toHaveBeenCalledWith('path/to/executable', [
        '--param1', '--param2', '-a', '-b', 'arg1', 'arg2'
      ], { opt1: 123, opt2: 'abc' });
    });

    it('returns an asynchronous child process', function() {
      spyOn(childProcess, 'spawn').and.returnValue('async process');

      var proc = command.create('test-command', ['arg1', 'arg2'], {opt1: 123, opt2: 'abc'}).asyncProcess();
      expect(proc).toEqual('async process');
      expect(childProcess.spawn).toHaveBeenCalledWith('path/to/executable', [
        '--param1', '--param2', '-a', '-b', 'arg1', 'arg2'
      ], { opt1: 123, opt2: 'abc' });
    });
  });
});